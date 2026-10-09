const $ = (selector, root = document) => root.querySelector(selector)
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)]
const elements = {
    articleList: $('#article-list'),
    gameList: $('#game-list'),
    gameCount: $('#game-count'),
    filters: $('#game-filters'),
    authDialog: $('#auth-dialog'),
    articleDialog: $('#article-dialog'),
    privacyDialog: $('#privacy-dialog'),
    authForm: $('#auth-form'),
    authError: $('#auth-error'),
    toast: $('#toast'),
}

let games = []
let articles = []
let comments = []
let user = null
let selectedArticle = null
let authMode = 'login'
let toastTimeout
let filterTimeout
let gamesRequest

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    })[character])
}

function formatDate(value) {
    return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
}

function localPreference(key, value) {
    try {
        if (value === undefined) return localStorage.getItem(key)
        localStorage.setItem(key, value)
    } catch {
        return null
    }
}

async function request(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            ...options.headers,
        },
    })
    if (response.status === 204) return null
    const result = await response.json()
    if (!response.ok) throw new Error(result.error ?? 'Não foi possível concluir esta ação.')
    return result
}

function showToast(message) {
    elements.toast.textContent = message
    elements.toast.classList.add('is-visible')
    clearTimeout(toastTimeout)
    toastTimeout = setTimeout(() => elements.toast.classList.remove('is-visible'), 3400)
}

function gameById(id) {
    return games.find((game) => game.id === id)
}

function updateUser(nextUser) {
    user = nextUser
    renderAccount()
    renderProfile()
    renderGames()
    if (selectedArticle) renderArticleDialog()
}

function renderAccount() {
    const accountButton = $('.account-button')
    if (!user) {
        accountButton.innerHTML = 'Entrar <span aria-hidden="true">↗</span>'
        accountButton.setAttribute('data-auth-open', '')
        accountButton.removeAttribute('data-profile-open')
        return
    }
    accountButton.textContent = user.username
    accountButton.removeAttribute('data-auth-open')
    accountButton.setAttribute('data-profile-open', '')
}

function renderArticles() {
    elements.articleList.innerHTML = articles.map((article, index) => `
        <button class="article-card ${index === 0 ? 'article-featured' : ''}" type="button" data-article-id="${escapeHtml(article.id)}">
            <span class="article-visual article-visual-${index + 1}"><span>${index === 0 ? 'FEATURED STORY' : `PLAYER ONE · 0${index + 1}`}</span><strong>${escapeHtml(gameById(article.gameId)?.symbol ?? 'P1')}</strong><i aria-hidden="true">↗</i></span>
            <span class="article-info"><span class="article-category">${escapeHtml(article.category)}</span><strong class="article-title">${escapeHtml(article.title)}</strong><span class="article-summary">${escapeHtml(article.summary)}</span><span class="article-byline">${escapeHtml(article.author)} <span>·</span> ${escapeHtml(article.readTime)} de leitura</span></span>
        </button>`).join('')
}

function renderGames() {
    if (!games.length) return
    const filterData = new FormData(elements.filters)
    const query = new URLSearchParams()
    for (const [key, value] of filterData) {
        if (String(value).trim()) query.set(key, String(value).trim())
    }
    const suffix = query.size ? `?${query}` : ''
    if (gamesRequest) gamesRequest.abort()
    gamesRequest = new AbortController()
    elements.gameCount.textContent = 'Buscando jogos...'
    fetch(`/api/games${suffix}`, { signal: gamesRequest.signal })
        .then(async (response) => {
            const data = await response.json()
            if (!response.ok) throw new Error(data.error ?? 'Não foi possível carregar os jogos.')
            elements.gameCount.textContent = `${data.length} ${data.length === 1 ? 'jogo encontrado' : 'jogos encontrados'}`
            elements.gameList.innerHTML = data.length
                ? data.map(renderGameCard).join('')
                : '<p class="empty-state">Nenhum jogo encontrado. Tente mudar os filtros.</p>'
        })
        .catch((error) => {
            if (error.name !== 'AbortError') {
                elements.gameCount.textContent = 'Não foi possível carregar os jogos.'
                elements.gameList.innerHTML = '<p class="empty-state">Tente novamente em instantes.</p>'
            }
        })
}

function renderGameCard(game) {
    const isWished = user?.wishlist.includes(game.id) ?? false
    const isPlayed = user?.played.includes(game.id) ?? false
    const existingRating = user?.ratings.find((rating) => rating.gameId === game.id)
    const average = game.userScore === null ? '—' : game.userScore.toFixed(1)
    const ratingControl = existingRating
        ? `<span class="your-score">Sua nota: ${existingRating.score}/10</span>`
        : `<label class="rating-picker"><span class="sr-only">Escolha uma nota para ${escapeHtml(game.title)}</span><select aria-label="Sua nota para ${escapeHtml(game.title)}"><option value="">Sua nota</option>${Array.from({ length: 11 }, (_, score) => `<option value="${score}">${score}/10</option>`).join('')}</select></label>`
    return `
        <article class="game-card">
            <div class="game-cover cover-${escapeHtml(game.color)}"><span>${escapeHtml(game.genre.toUpperCase())}</span><strong>${escapeHtml(game.symbol)}</strong><small>${escapeHtml(game.title)}</small></div>
            <div class="game-card-content">
                <div class="game-title-row"><div><h3>${escapeHtml(game.title)}</h3><p>${escapeHtml(game.developer)}</p></div><span class="score-pill"><strong>${average}</strong><small>USER SCORE</small></span></div>
                <div class="game-meta"><span>${escapeHtml(game.platforms.join(' · '))}</span><span>${new Date(`${game.releaseDate}T12:00:00`).getFullYear()} · ${escapeHtml(game.genre)}</span></div>
                <div class="game-actions">${ratingControl}<button class="icon-button list-toggle ${isWished ? 'is-saved' : ''}" type="button" data-list="wishlist" data-game-id="${escapeHtml(game.id)}" aria-label="${isWished ? 'Remover da' : 'Adicionar à'} lista de desejos" title="${isWished ? 'Remover dos desejos' : 'Adicionar aos desejos'}">${isWished ? '♥' : '♡'}</button><button class="played-toggle ${isPlayed ? 'is-saved' : ''}" type="button" data-list="played" data-game-id="${escapeHtml(game.id)}">${isPlayed ? '✓ Jogado' : '+ Joguei'}</button><button class="rate-button" type="button" data-rate-game="${escapeHtml(game.id)}" ${existingRating ? 'disabled' : ''}>${existingRating ? 'Avaliado' : 'Avaliar'}</button></div>
            </div>
        </article>`
}

function renderProfile() {
    const section = $('#perfil')
    if (!user) {
        section.hidden = true
        return
    }
    section.hidden = false
    $('#profile-name').textContent = `${user.username}.`
    const ratedCount = user.ratings.length
    $('#profile-stats').innerHTML = `
        <div><strong>${user.wishlist.length}</strong><span>na lista de desejos</span></div>
        <div><strong>${user.played.length}</strong><span>jogos jogados</span></div>
        <div><strong>${ratedCount}</strong><span>avaliações</span></div>
        <div><strong>${user.readCount}</strong><span>artigos lidos</span></div>`
    $('#wishlist-list').innerHTML = renderProfileGames(user.wishlist)
    $('#played-list').innerHTML = renderProfileGames(user.played)
    $('#achievement-list').innerHTML = user.achievements.length
        ? user.achievements.map((badge) => `<span class="achievement-badge"><span aria-hidden="true">✦</span>${escapeHtml(badge)}</span>`).join('')
        : '<p class="muted-copy">Leia artigos, avalie jogos e monte sua lista para desbloquear conquistas.</p>'
}

function renderProfileGames(ids) {
    const entries = ids.map(gameById).filter(Boolean)
    return entries.length
        ? `<ul class="profile-game-list">${entries.map((game) => `<li>${escapeHtml(game.title)}</li>`).join('')}</ul>`
        : '<p class="muted-copy">Sua lista está vazia por enquanto.</p>'
}

function renderArticleDialog() {
    if (!selectedArticle) return
    const article = selectedArticle
    const articleComments = comments.filter((comment) => comment.articleId === article.id)
    const commentsMarkup = articleComments.length
        ? articleComments.map((comment) => `
            <article class="comment ${comment.parentId ? 'comment-reply' : ''}">
                <div class="comment-heading"><strong>${escapeHtml(comment.username)}</strong><time datetime="${escapeHtml(comment.createdAt)}">${formatDate(comment.createdAt)}</time></div>
                <p>${escapeHtml(comment.text)}</p>
                <div class="comment-actions"><button type="button" data-comment-like="${escapeHtml(comment.id)}">♡ ${comment.likes}${comment.likedByMe ? ' · Curtido' : ''}</button><button type="button" data-comment-reply="${escapeHtml(comment.id)}">Responder</button></div>
            </article>`).join('')
        : '<p class="muted-copy">Ainda não há comentários. Seja o primeiro a começar a conversa.</p>'
    $('#article-content').innerHTML = `
        <p class="eyebrow">${escapeHtml(article.category)}${article.score ? ` · METASCORE ${article.score}/10` : ''}</p>
        <h2 id="article-title">${escapeHtml(article.title)}</h2>
        <p class="article-dialog-byline">${escapeHtml(article.author)} · ${formatDate(article.date)} · ${escapeHtml(article.readTime)} de leitura</p>
        <p class="article-dialog-summary">${escapeHtml(article.summary)}</p>
        <div class="article-body">${escapeHtml(article.body).split('\n').filter(Boolean).map((paragraph) => `<p>${paragraph}</p>`).join('')}</div>
        <section class="comments-section" aria-label="Comentários">
            <div class="comments-heading"><h3>Conversa da comunidade</h3><span>${articleComments.length}</span></div>
            <div class="comment-list">${commentsMarkup}</div>
            <form class="comment-form" id="comment-form" data-article-id="${escapeHtml(article.id)}">
                <label for="comment-text">${user ? 'Deixe sua opinião' : 'Entre para participar da conversa'}</label>
                ${user ? `<textarea id="comment-text" name="text" maxlength="1200" required placeholder="Uma boa conversa começa com respeito..."></textarea><button class="button button-primary" type="submit">Publicar comentário <span aria-hidden="true">→</span></button>` : '<button class="button button-outline" type="button" data-auth-open>Entrar para comentar</button>'}
            </form>
        </section>`
}

function setAuthMode(mode) {
    authMode = mode
    const isRegister = mode === 'register'
    $$('.auth-tab').forEach((tab) => {
        const selected = tab.dataset.authTab === mode
        tab.classList.toggle('is-active', selected)
        tab.setAttribute('aria-selected', String(selected))
    })
    $('#username-label').hidden = !isRegister
    $('#username-label input').required = isRegister
    $('#consent-label').hidden = !isRegister
    $('#consent-label input').required = isRegister
    $('#auth-form [name="password"]').autocomplete = isRegister ? 'new-password' : 'current-password'
    $('.form-submit').innerHTML = `${isRegister ? 'Criar conta' : 'Entrar'} <span aria-hidden="true">→</span>`
    elements.authError.textContent = ''
}

function openAuth(mode = 'login') {
    setAuthMode(mode)
    elements.authDialog.showModal()
}

async function refreshBootstrap() {
    const data = await request('/api/bootstrap')
    games = data.games
    articles = data.articles
    comments = data.comments
    user = data.user
    renderArticles()
    renderAccount()
    renderProfile()
    renderGames()
}

document.documentElement.dataset.theme = localPreference('player-theme') ?? 'dark'
$('.theme-toggle').addEventListener('click', () => {
    const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = nextTheme
    localPreference('player-theme', nextTheme)
    $('.theme-toggle').setAttribute('aria-label', nextTheme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro')
    $('meta[name="theme-color"]').content = nextTheme === 'dark' ? '#0b0a12' : '#f5f4fa'
})

document.addEventListener('click', async (event) => {
    const target = event.target.closest('button, [data-article-id], [data-profile-open]')
    if (!target) return
    try {
        if (target.matches('[data-dialog-close]')) target.closest('dialog').close()
        if (target.matches('[data-auth-open]')) openAuth()
        if (target.matches('[data-profile-open]')) $('#perfil').scrollIntoView({ behavior: 'smooth', block: 'start' })
        if (target.matches('[data-privacy-open]')) elements.privacyDialog.showModal()
        if (target.matches('[data-auth-tab]')) setAuthMode(target.dataset.authTab)
        if (target.matches('[data-article-id]')) {
            selectedArticle = articles.find((article) => article.id === target.dataset.articleId)
            if (!selectedArticle) return
            renderArticleDialog()
            elements.articleDialog.showModal()
            if (user) {
                const result = await request(`/api/articles/${selectedArticle.id}/read`, { method: 'POST' })
                updateUser(result.user)
            }
        }
        if (target.matches('[data-list]')) {
            if (!user) return openAuth()
            const result = await request(`/api/me/lists/${target.dataset.list}/${target.dataset.gameId}`, { method: 'PUT' })
            updateUser(result.user)
            showToast(result.saved ? 'Jogo adicionado à lista.' : 'Jogo removido da lista.')
        }
        if (target.matches('[data-rate-game]')) {
            if (!user) return openAuth()
            const picker = target.closest('.game-actions').querySelector('select')
            if (!picker?.value) return showToast('Escolha sua nota antes de avaliar.')
            const result = await request(`/api/games/${target.dataset.rateGame}/rating`, {
                method: 'POST',
                body: JSON.stringify({ score: Number(picker.value) }),
            })
            games = games.map((game) => game.id === result.game.id ? result.game : game)
            updateUser(result.user)
            showToast('Avaliação registrada. Obrigado por compartilhar!')
        }
        if (target.matches('[data-comment-like]')) {
            if (!user) return openAuth()
            const result = await request(`/api/comments/${target.dataset.commentLike}/like`, { method: 'POST' })
            const comment = comments.find((entry) => entry.id === target.dataset.commentLike)
            if (comment) {
                comment.likes = result.likes
                comment.likedByMe = result.liked
            }
            renderArticleDialog()
        }
        if (target.matches('[data-comment-reply]')) {
            if (!user) return openAuth()
            const form = $('#comment-form')
            form.dataset.parentId = target.dataset.commentReply
            $('#comment-text').placeholder = 'Escreva sua resposta...'
            $('#comment-text').focus()
            showToast('Sua resposta será publicada neste comentário.')
        }
        if (target.matches('#logout-button')) {
            await request('/api/auth/logout', { method: 'POST' })
            user = null
            renderAccount()
            renderProfile()
            renderGames()
            if (selectedArticle) renderArticleDialog()
            showToast('Você saiu da sua conta.')
        }
        if (target.matches('#delete-account')) {
            if (!window.confirm('Excluir sua conta e todos os dados associados? Esta ação não pode ser desfeita.')) return
            await request('/api/account', { method: 'DELETE' })
            user = null
            renderAccount()
            renderProfile()
            renderGames()
            if (selectedArticle) renderArticleDialog()
            showToast('Conta e dados associados excluídos.')
        }
    } catch (error) {
        showToast(error.message)
    }
})

elements.authForm.addEventListener('submit', async (event) => {
    event.preventDefault()
    elements.authError.textContent = ''
    const form = new FormData(elements.authForm)
    const payload = {
        email: form.get('email'),
        password: form.get('password'),
    }
    if (authMode === 'register') {
        payload.username = form.get('username')
        payload.consent = form.get('consent') === 'on'
    }
    try {
        const result = await request(`/api/auth/${authMode}`, { method: 'POST', body: JSON.stringify(payload) })
        updateUser(result.user)
        elements.authDialog.close()
        elements.authForm.reset()
        setAuthMode('login')
        showToast(`Bem-vindo${authMode === 'register' ? ' à comunidade' : ' de volta'}, ${user.username}!`)
    } catch (error) {
        elements.authError.textContent = error.message
    }
})

elements.filters.addEventListener('input', () => {
    clearTimeout(filterTimeout)
    filterTimeout = setTimeout(renderGames, 160)
})

elements.filters.addEventListener('change', renderGames)

document.addEventListener('submit', async (event) => {
    const form = event.target.closest('#comment-form')
    if (!form) return
    event.preventDefault()
    if (!user) return openAuth()
    const text = new FormData(form).get('text')
    const payload = { text, parentId: form.dataset.parentId ?? null }
    try {
        const result = await request(`/api/articles/${form.dataset.articleId}/comments`, {
            method: 'POST',
            body: JSON.stringify(payload),
        })
        if (result.comment) comments.push(result.comment)
        updateUser(result.user)
        if (result.hidden) showToast('Seu comentário foi ocultado automaticamente e encaminhado para moderação.')
        else showToast('Comentário publicado. Valeu por participar!')
        renderArticleDialog()
    } catch (error) {
        showToast(error.message)
    }
})

refreshBootstrap().catch((error) => {
    elements.articleList.innerHTML = '<p class="empty-state">Não foi possível conectar ao portal. Atualize a página para tentar novamente.</p>'
    elements.gameCount.textContent = error.message
    elements.gameList.innerHTML = ''
})
