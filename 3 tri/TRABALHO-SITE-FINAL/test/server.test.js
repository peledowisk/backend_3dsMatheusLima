import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { mkdtempSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const testDirectory = mkdtempSync(join(tmpdir(), 'player-one-test-'))
process.env.P1_DATA_FILE = join(testDirectory, 'site.json')
process.env.SESSION_SECRET = 'test-session-secret-with-more-than-32-characters'

const { app } = await import('../server.js')
let server
let baseUrl

before(async () => {
    server = app.listen(0, '127.0.0.1')
    await new Promise((resolve) => server.once('listening', resolve))
    baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
    server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
    rmSync(testDirectory, { recursive: true, force: true })
})

async function api(path, { method = 'GET', body, cookie } = {}) {
    const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: {
            ...(body ? { 'Content-Type': 'application/json' } : {}),
            ...(cookie ? { Cookie: cookie } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
    })
    return { response, data: response.status === 204 ? null : await response.json() }
}

test('public section paths serve their own pages', async () => {
    for (const [path, title] of Object.entries({
        '/produtos': '<title>Produtos — Player One</title>',
        '/sobre': '<title>Sobre — Player One</title>',
        '/contato': '<title>Contato — Player One</title>',
    })) {
        const response = await fetch(`${baseUrl}${path}`)
        assert.equal(response.status, 200)
        assert.match(response.headers.get('content-type'), /text\/html/)
        assert.ok((await response.text()).includes(title))
    }
})

test('accounts, game scores, lists, profiles, comments, achievements, and filters work together', async () => {
    const registration = await api('/api/auth/register', {
        method: 'POST',
        body: {
            username: 'GameTester',
            email: 'gamer@example.com',
            password: 'correct-horse-42',
            consent: true,
        },
    })
    assert.equal(registration.response.status, 201)
    const cookie = registration.response.headers.get('set-cookie').split(';')[0]
    assert.equal(registration.data.user.username, 'GameTester')

    const unauthenticatedRating = await api('/api/games/clair-obscur/rating', {
        method: 'POST',
        body: { score: 10 },
    })
    assert.equal(unauthenticatedRating.response.status, 401)

    const rating = await api('/api/games/clair-obscur/rating', {
        method: 'POST',
        cookie,
        body: { score: 10 },
    })
    assert.equal(rating.response.status, 201)
    assert.equal(rating.data.game.userScore, 10)
    assert.deepEqual(rating.data.user.played, ['clair-obscur'])

    const duplicateRating = await api('/api/games/clair-obscur/rating', {
        method: 'POST',
        cookie,
        body: { score: 1 },
    })
    assert.equal(duplicateRating.response.status, 409)

    const wishlist = await api('/api/me/lists/wishlist/hades-ii', { method: 'PUT', cookie })
    assert.equal(wishlist.data.saved, true)

    const articleRead = await api('/api/articles/expedition-33-review/read', { method: 'POST', cookie })
    assert.ok(articleRead.data.user.achievements.includes('Primeira leitura'))

    const hiddenComment = await api('/api/articles/expedition-33-review/comments', {
        method: 'POST',
        cookie,
        body: { text: 'Você é um arrombado' },
    })
    assert.equal(hiddenComment.data.hidden, true)
    assert.equal(hiddenComment.data.comment, null)

    const publicComment = await api('/api/articles/expedition-33-review/comments', {
        method: 'POST',
        cookie,
        body: { text: 'A combinação de turnos e ação parece muito interessante.' },
    })
    assert.equal(publicComment.response.status, 201)
    assert.ok(publicComment.data.user.achievements.includes('Voz da comunidade'))

    const liked = await api(`/api/comments/${publicComment.data.comment.id}/like`, { method: 'POST', cookie })
    assert.equal(liked.data.liked, true)
    assert.equal(liked.data.likes, 1)

    const profile = await api(`/api/users/${registration.data.user.id}`)
    assert.equal(profile.response.status, 200)
    assert.equal(profile.data.wishlist[0].id, 'hades-ii')
    assert.equal(Object.hasOwn(profile.data, 'email'), false)

    const search = await api('/api/games?platform=PC&genre=RPG&year=2025&minScore=9')
    assert.deepEqual(search.data.map((game) => game.id), ['clair-obscur'])

    const bootstrap = await api('/api/bootstrap', { cookie })
    assert.equal(bootstrap.data.comments.length, 1)
    assert.equal(bootstrap.data.comments[0].text, 'A combinação de turnos e ação parece muito interessante.')

    const storedData = readFileSync(process.env.P1_DATA_FILE, 'utf8')
    assert.equal(storedData.includes('correct-horse-42'), false)
    assert.equal(storedData.includes('passwordDigest'), true)
})
