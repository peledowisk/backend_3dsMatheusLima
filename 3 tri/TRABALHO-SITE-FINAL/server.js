import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import express from 'express'

const root = import.meta.dirname
const dataFile = process.env.P1_DATA_FILE ?? join(root, 'data', 'site.json')
if (process.env.NODE_ENV === 'production' && Buffer.byteLength(process.env.SESSION_SECRET ?? '') < 32) {
    throw new Error('Configure SESSION_SECRET com pelo menos 32 caracteres antes de iniciar em produção.')
}
const sessionSecret = process.env.SESSION_SECRET ?? randomBytes(32).toString('hex')
const sessionDuration = 7 * 24 * 60 * 60

export const games = [
    { id: 'hades-ii', title: 'Hades II', developer: 'Supergiant Games', platforms: ['PC', 'Nintendo Switch'], releaseDate: '2025-09-25', genre: 'Roguelike', color: 'ember', symbol: 'H' },
    { id: 'clair-obscur', title: 'Clair Obscur: Expedition 33', developer: 'Sandfall Interactive', platforms: ['PC', 'PlayStation 5', 'Xbox Series X|S'], releaseDate: '2025-04-24', genre: 'RPG', color: 'rose', symbol: '33' },
    { id: 'black-myth-wukong', title: 'Black Myth: Wukong', developer: 'Game Science', platforms: ['PC', 'PlayStation 5'], releaseDate: '2024-08-20', genre: 'Ação', color: 'gold', symbol: '悟' },
    { id: 'stardew-valley', title: 'Stardew Valley', developer: 'ConcernedApe', platforms: ['PC', 'Nintendo Switch', 'PlayStation 5', 'Xbox Series X|S'], releaseDate: '2016-02-26', genre: 'Simulação', color: 'green', symbol: 'SV' },
    { id: 'elden-ring', title: 'Elden Ring', developer: 'FromSoftware', platforms: ['PC', 'PlayStation 5', 'Xbox Series X|S'], releaseDate: '2022-02-25', genre: 'RPG', color: 'amber', symbol: 'ER' },
    { id: 'astro-bot', title: 'Astro Bot', developer: 'Team Asobi', platforms: ['PlayStation 5'], releaseDate: '2024-09-06', genre: 'Aventura', color: 'blue', symbol: 'AB' },
    { id: 'cyberpunk-2077', title: 'Cyberpunk 2077', developer: 'CD PROJEKT RED', platforms: ['PC', 'PlayStation 5', 'Xbox Series X|S'], releaseDate: '2020-12-10', genre: 'RPG', color: 'yellow', symbol: '2077' },
    { id: 'helldivers-2', title: 'Helldivers 2', developer: 'Arrowhead Game Studios', platforms: ['PC', 'PlayStation 5', 'Xbox Series X|S'], releaseDate: '2024-02-08', genre: 'Ação', color: 'steel', symbol: 'HD2' },
]

export const articles = [
    {
        id: 'expedition-33-review',
        category: 'ANÁLISE',
        title: 'Expedition 33 transforma cada batalha em um espetáculo',
        summary: 'O RPG da Sandfall combina combates por turnos e ação em uma aventura com identidade própria.',
        author: 'Redação Player One',
        date: '2025-04-24',
        readTime: '8 min',
        gameId: 'clair-obscur',
        score: 9,
        body: 'Clair Obscur: Expedition 33 encontra frescor em um sistema de combate que pede atenção a cada movimento. Aparar, esquivar e escolher o momento certo transforma encontros por turnos em duelos cheios de ritmo. É uma aventura sobre um mundo intrigante, personagens marcantes e o prazer de dominar uma mecânica que sempre tem mais para mostrar.',
    },
    {
        id: 'hades-ii-guide',
        category: 'GUIA',
        title: 'Hades II: dicas para sua primeira descida ao Submundo',
        summary: 'Conheça as armas, recursos e bênçãos que ajudam a construir uma jornada melhor.',
        author: 'Lia Ferreira',
        date: '2025-09-25',
        readTime: '6 min',
        gameId: 'hades-ii',
        body: 'Cada tentativa em Hades II é uma oportunidade de experimentar. Teste armas diferentes, observe o ritmo dos inimigos e use a magia para abrir espaço. As bênçãos funcionam melhor quando você escolhe uma direção para sua construção em vez de tentar combinar tudo. E lembre: um retorno ao início também traz recursos e novas conversas.',
    },
    {
        id: 'jogar-em-cooperacao',
        category: 'COMUNIDADE',
        title: 'A próxima aventura pode ser melhor em equipe',
        summary: 'De campanhas cooperativas a partidas rápidas, há sempre um jeito de chamar a galera.',
        author: 'Redação Player One',
        date: '2025-08-12',
        readTime: '4 min',
        body: 'Jogar junto é mais do que dividir uma tela: é descobrir como cada pessoa aborda um desafio e criar histórias que continuam depois da partida. Para começar, escolham um jogo que todos consigam acessar, combinem o tempo disponível e deixem espaço para experimentar. A melhor estratégia é a que mantém todo mundo se divertindo.',
    },
]

const initialState = () => ({ users: [], comments: [], readArticles: {} })

function loadState() {
    try {
        return JSON.parse(readFileSync(dataFile, 'utf8'))
    } catch (error) {
        if (error.code !== 'ENOENT') throw error
        const state = initialState()
        persistState(state)
        return state
    }
}

let state = loadState()

function persistState(nextState = state) {
    mkdirSync(dirname(dataFile), { recursive: true })
    const temporaryFile = `${dataFile}.tmp`
    writeFileSync(temporaryFile, JSON.stringify(nextState, null, 2), { mode: 0o600 })
    renameSync(temporaryFile, dataFile)
}

function publicUser(user) {
    if (!user) return null
    const readCount = (state.readArticles[user.id] ?? []).length
    const commentCount = state.comments.filter((comment) => comment.userId === user.id && !comment.hidden).length
    const achievements = [
        ...(readCount > 0 ? ['Primeira leitura'] : []),
        ...(commentCount > 0 ? ['Voz da comunidade'] : []),
        ...(readCount >= 3 ? ['Maratonista de artigos'] : []),
        ...(user.ratings.length > 0 ? ['Crítico de plantão'] : []),
        ...(user.wishlist.length >= 3 ? ['Caçador de mundos'] : []),
    ]
    return {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
        wishlist: user.wishlist,
        played: user.played,
        ratings: user.ratings,
        achievements,
        readCount,
    }
}

function currentUser(request) {
    const token = readCookie(request, 'player_session')
    if (!token) return null
    const [userId, expiry, signature] = token.split('.')
    if (!userId || !expiry || !signature || !Number.isFinite(Number(expiry)) || Number(expiry) < Date.now()) return null
    const payload = `${userId}.${expiry}`
    const expected = createHmac('sha256', sessionSecret).update(payload).digest()
    let provided
    try {
        provided = Buffer.from(signature, 'base64url')
    } catch {
        return null
    }
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null
    return state.users.find((user) => user.id === userId) ?? null
}

function readCookie(request, name) {
    const cookie = request.headers.cookie?.split(';').find((part) => part.trim().startsWith(`${name}=`))
    return cookie ? decodeURIComponent(cookie.trim().slice(name.length + 1)) : null
}

function setSession(response, userId) {
    const expiry = Date.now() + sessionDuration * 1000
    const payload = `${userId}.${expiry}`
    const signature = createHmac('sha256', sessionSecret).update(payload).digest('base64url')
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
    response.setHeader('Set-Cookie', `player_session=${encodeURIComponent(`${payload}.${signature}`)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${sessionDuration}${secure}`)
}

function safeCompare(first, second) {
    const firstBuffer = Buffer.from(first, 'hex')
    const secondBuffer = Buffer.from(second, 'hex')
    return firstBuffer.length === secondBuffer.length && timingSafeEqual(firstBuffer, secondBuffer)
}

function gameWithScores(game) {
    const ratings = state.users.flatMap((user) => user.ratings.filter((rating) => rating.gameId === game.id))
    const userScore = ratings.length
        ? Math.round(ratings.reduce((total, rating) => total + rating.score, 0) / ratings.length * 10) / 10
        : null
    return { ...game, userScore, ratingCount: ratings.length }
}

function gameById(gameId) {
    return games.find((game) => game.id === gameId)
}

function findPublicComment(comment) {
    return {
        id: comment.id,
        articleId: comment.articleId,
        parentId: comment.parentId,
        userId: comment.userId,
        username: state.users.find((user) => user.id === comment.userId)?.username ?? 'Jogador',
        text: comment.text,
        createdAt: comment.createdAt,
        likes: comment.likes.length,
        likedByMe: false,
    }
}

const blockedTerms = [
    /\b(?:arrombado|bicha|boiola|cuz[aã]o|fascista de merda|f[._ -]?d[._ -]?p|macaco|nazista de merda|retardad[oa]|traveco|viado)\b/iu,
]

function containsOffensiveLanguage(text) {
    return blockedTerms.some((term) => term.test(text))
}

function validText(value, maxLength) {
    return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maxLength
}

function requireUser(request, response, next) {
    const user = currentUser(request)
    if (!user) return response.status(401).json({ error: 'Entre na sua conta para continuar.' })
    request.user = user
    next()
}

export const app = express()

app.disable('x-powered-by')
app.use((request, response, next) => {
    response.setHeader('X-Content-Type-Options', 'nosniff')
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    response.setHeader('Content-Security-Policy', "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; script-src 'self'; connect-src 'self'; frame-src https://www.youtube-nocookie.com https://player.twitch.tv; object-src 'none'; base-uri 'self'; frame-ancestors 'none'")
    next()
})
app.use(express.json({ limit: '10kb' }))

app.get('/api/bootstrap', (request, response) => {
    const user = currentUser(request)
    response.json({
        games: games.map(gameWithScores),
        articles,
        comments: state.comments.filter((comment) => !comment.hidden).map(findPublicComment),
        user: publicUser(user),
    })
})

app.get('/api/games', (request, response) => {
    const search = String(request.query.q ?? '').trim().toLocaleLowerCase('pt-BR')
    const platform = String(request.query.platform ?? '')
    const genre = String(request.query.genre ?? '')
    const year = String(request.query.year ?? '')
    const minimumScore = Number(request.query.minScore ?? 0)
    const filteredGames = games.map(gameWithScores).filter((game) => {
        const matchesSearch = !search || `${game.title} ${game.developer} ${game.genre}`.toLocaleLowerCase('pt-BR').includes(search)
        const matchesPlatform = !platform || game.platforms.includes(platform)
        const matchesGenre = !genre || game.genre === genre
        const matchesYear = !year || game.releaseDate.startsWith(year)
        const matchesScore = !minimumScore || (game.userScore !== null && game.userScore >= minimumScore)
        return matchesSearch && matchesPlatform && matchesGenre && matchesYear && matchesScore
    })
    response.json(filteredGames)
})

app.post('/api/auth/register', async (request, response, next) => {
    const { username, email, password, consent } = request.body ?? {}
    if (!validText(username, 24) || username.trim().length < 3) {
        return response.status(400).json({ error: 'O nome precisa ter entre 3 e 24 caracteres.' })
    }
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
        return response.status(400).json({ error: 'Informe um e-mail válido.' })
    }
    if (typeof password !== 'string' || password.length < 10 || password.length > 128) {
        return response.status(400).json({ error: 'A senha precisa ter entre 10 e 128 caracteres.' })
    }
    if (consent !== true) return response.status(400).json({ error: 'É necessário aceitar o aviso de privacidade.' })
    const normalizedEmail = email.trim().toLocaleLowerCase('en-US')
    const normalizedUsername = username.trim()
    if (state.users.some((user) => user.email === normalizedEmail)) {
        return response.status(409).json({ error: 'Este e-mail já possui uma conta.' })
    }
    try {
        const salt = randomBytes(16).toString('hex')
        const digest = await new Promise((resolve, reject) => {
            scrypt(password, salt, 64, (error, key) => error ? reject(error) : resolve(key.toString('hex')))
        })
        if (state.users.some((user) => user.email === normalizedEmail)) {
            return response.status(409).json({ error: 'Este e-mail já possui uma conta.' })
        }
        const user = {
            id: randomBytes(16).toString('hex'),
            username: normalizedUsername,
            email: normalizedEmail,
            passwordSalt: salt,
            passwordDigest: digest,
            createdAt: new Date().toISOString(),
            wishlist: [],
            played: [],
            ratings: [],
        }
        state.users.push(user)
        persistState()
        setSession(response, user.id)
        response.status(201).json({ user: publicUser(user) })
    } catch (error) {
        next(error)
    }
})

app.post('/api/auth/login', async (request, response, next) => {
    const { email, password } = request.body ?? {}
    if (typeof email !== 'string' || typeof password !== 'string' || password.length > 128) {
        return response.status(400).json({ error: 'Informe seu e-mail e senha.' })
    }
    try {
        const user = state.users.find((candidate) => candidate.email === email.trim().toLocaleLowerCase('en-US'))
        const salt = user?.passwordSalt ?? 'missing-user-salt'
        const digest = await new Promise((resolve, reject) => {
            scrypt(password, salt, 64, (error, key) => error ? reject(error) : resolve(key.toString('hex')))
        })
        if (!user || !safeCompare(digest, user.passwordDigest)) {
            return response.status(401).json({ error: 'E-mail ou senha incorretos.' })
        }
        setSession(response, user.id)
        response.json({ user: publicUser(user) })
    } catch (error) {
        next(error)
    }
})

app.post('/api/auth/logout', (request, response) => {
    response.setHeader('Set-Cookie', 'player_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0')
    response.status(204).end()
})

app.delete('/api/account', requireUser, (request, response) => {
    state.users = state.users.filter((user) => user.id !== request.user.id)
    state.comments = state.comments.filter((comment) => comment.userId !== request.user.id)
    delete state.readArticles[request.user.id]
    persistState()
    response.setHeader('Set-Cookie', 'player_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0')
    response.status(204).end()
})

app.post('/api/games/:gameId/rating', requireUser, (request, response) => {
    const game = gameById(request.params.gameId)
    const score = request.body?.score
    if (!game) return response.status(404).json({ error: 'Jogo não encontrado.' })
    if (!Number.isInteger(score) || score < 0 || score > 10) {
        return response.status(400).json({ error: 'A nota deve ser um número inteiro entre 0 e 10.' })
    }
    if (request.user.ratings.some((rating) => rating.gameId === game.id)) {
        return response.status(409).json({ error: 'Você já avaliou este jogo. Cada conta pode votar uma vez.' })
    }
    request.user.ratings.push({ gameId: game.id, score, createdAt: new Date().toISOString() })
    if (!request.user.played.includes(game.id)) request.user.played.push(game.id)
    persistState()
    response.status(201).json({ game: gameWithScores(game), user: publicUser(request.user) })
})

app.put('/api/me/lists/:list/:gameId', requireUser, (request, response) => {
    const game = gameById(request.params.gameId)
    const listName = request.params.list
    if (!game) return response.status(404).json({ error: 'Jogo não encontrado.' })
    if (listName !== 'wishlist' && listName !== 'played') {
        return response.status(404).json({ error: 'Lista não encontrada.' })
    }
    const list = request.user[listName]
    const index = list.indexOf(game.id)
    const saved = index === -1
    if (saved) list.push(game.id)
    else list.splice(index, 1)
    persistState()
    response.json({ saved, user: publicUser(request.user) })
})

app.get('/api/users/:userId', (request, response) => {
    const user = state.users.find((candidate) => candidate.id === request.params.userId)
    if (!user) return response.status(404).json({ error: 'Perfil não encontrado.' })
    const profile = publicUser(user)
    response.json({
        ...profile,
        wishlist: profile.wishlist.map((id) => gameWithScores(gameById(id))).filter(Boolean),
        played: profile.played.map((id) => gameWithScores(gameById(id))).filter(Boolean),
    })
})

app.post('/api/articles/:articleId/read', requireUser, (request, response) => {
    if (!articles.some((article) => article.id === request.params.articleId)) {
        return response.status(404).json({ error: 'Artigo não encontrado.' })
    }
    const read = state.readArticles[request.user.id] ?? []
    if (!read.includes(request.params.articleId)) read.push(request.params.articleId)
    state.readArticles[request.user.id] = read
    persistState()
    response.json({ user: publicUser(request.user) })
})

app.post('/api/articles/:articleId/comments', requireUser, (request, response) => {
    const { articleId } = request.params
    const { text, parentId = null } = request.body ?? {}
    if (!articles.some((article) => article.id === articleId)) {
        return response.status(404).json({ error: 'Artigo não encontrado.' })
    }
    if (!validText(text, 1200)) return response.status(400).json({ error: 'O comentário deve ter entre 1 e 1200 caracteres.' })
    if (parentId !== null && !state.comments.some((comment) => comment.id === parentId && comment.articleId === articleId && !comment.hidden)) {
        return response.status(400).json({ error: 'A resposta precisa estar ligada a um comentário válido.' })
    }
    const comment = {
        id: randomBytes(12).toString('hex'),
        articleId,
        parentId,
        userId: request.user.id,
        text: text.trim(),
        createdAt: new Date().toISOString(),
        likes: [],
        hidden: containsOffensiveLanguage(text),
    }
    state.comments.push(comment)
    persistState()
    response.status(201).json({
        comment: comment.hidden ? null : findPublicComment(comment),
        hidden: comment.hidden,
        user: publicUser(request.user),
    })
})

app.post('/api/comments/:commentId/like', requireUser, (request, response) => {
    const comment = state.comments.find((candidate) => candidate.id === request.params.commentId && !candidate.hidden)
    if (!comment) return response.status(404).json({ error: 'Comentário não encontrado.' })
    const index = comment.likes.indexOf(request.user.id)
    const liked = index === -1
    if (liked) comment.likes.push(request.user.id)
    else comment.likes.splice(index, 1)
    persistState()
    response.json({ liked, likes: comment.likes.length })
})

app.use(express.static(join(root, 'src', 'publico'), { maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0 }))

app.get('/', (request, response) => {
    response.sendFile(join(root, 'src', 'paginas', 'index.html'))
})

app.get(['/produtos', '/sobre', '/contato'], (request, response) => {
    const page = {
        '/produtos': 'produtos.html',
        '/sobre': 'sobre.html',
        '/contato': 'contato.html',
    }[request.path]
    response.sendFile(join(root, 'src', 'paginas', page))
})

app.use((error, request, response, next) => {
    console.error('Erro inesperado na aplicação:', error)
    if (response.headersSent) return next(error)
    response.status(500).json({ error: 'Ocorreu um erro inesperado. Tente novamente.' })
})

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const port = Number(process.env.PORT ?? 3000)
    app.listen(port, () => console.log(`Player One disponível na porta ${port}`))
}
