# Requirements Document

## Introduction

O JstudioPlay é um player IPTV/M3U self-hosted construído em Node.js + Express com front-end vanilla JS (SPA com hash routing). Este documento especifica três melhorias prioritárias de experiência do usuário para o player:

1. **Busca em tempo real de canais** — filtro instantâneo sem reload sobre canais já carregados em memória, incluindo funcionamento offline.
2. **Indicador de saúde do canal (Health Indicator)** — ícone visual de status (online/offline/desconhecido) por canal, carregado de forma não-bloqueante e com respeito a dados móveis.
3. **EPG inline no player (O que está passando agora)** — exibição do programa atual e do próximo diretamente na linha de cada canal, consumindo os endpoints `/epg/now` e `/epg/grid` já existentes no backend.

O contexto técnico relevante inclui: `public/static/app.js` (SPA vanilla JS com `renderChannels()` / `renderChannelRow()`), `design-v8.css`, `automation.js`, endpoints backend `/epg/now`, `/epg/grid`, `/playlists/:id/channels` e `/automation/probe-speed`. Os objetos de canal já possuem o campo `status` (`'online'|'offline'|'unknown'`) persistido pelo `streamChecker` no servidor. O ambiente inclui PWA e Android via Capacitor — performance móvel é critério de qualidade não-funcional.

---

## Glossary

- **Player**: A página SPA acessada em `#/player`, que inclui o painel de categorias, painel de canais e área de vídeo.
- **Channel_List**: O componente `#channel-list` no DOM, renderizado pela função `renderChannels()` em `app.js`, que exibe as linhas de canais filtradas e paginadas.
- **Channel_Row**: Uma entrada individual na Channel_List, renderizada por `renderChannelRow()`, representando um canal ou episódio.
- **Search_Filter**: O componente de busca em `#channel-search`, cujo valor é mantido em `state.query`, que já filtra canais em memória via `renderChannels()`.
- **Health_Indicator**: O ícone de status visual (verde/cinza/vermelho) exibido em cada Channel_Row para indicar a disponibilidade do stream.
- **EPG_Inline**: A exibição do programa atual e do próximo diretamente na Channel_Row, sem abrir diálogos.
- **EPG_Manager**: O serviço backend `epgManager.js` que expõe `/api/epg/now` (retorna `{ hasEpg, current: { title, startTimeStr, endTimeStr, progressPercent }, next: { title, startTimeStr } }`) e `/api/epg/grid`.
- **Stream_Status**: O campo `status` do objeto de canal, com valores `'online'`, `'offline'` ou `'unknown'`, já persistido pelo `streamChecker` e retornado pelo endpoint `/playlists/:id/channels`.
- **Probe_Speed_Endpoint**: O endpoint `POST /api/automation/probe-speed` que aceita até 30 canais e retorna `{ results: [{ id, status, latency, httpStatus }] }`.
- **Data_Saver_Mode**: Configuração do usuário (persistida no `localStorage` como `'m3u-data-saver'`) que desabilita verificações de stream ativas para economizar dados móveis.
- **EPG_Cache**: Estrutura em memória (JavaScript `Map`) no front-end que armazena os dados EPG por nome de canal para evitar requisições duplicadas durante a sessão.
- **Visible_Viewport**: O conjunto de Channel_Rows atualmente visíveis na área de rolagem do Channel_List, determinado por `IntersectionObserver`.

---

## Requirements

### Requirement 1: Busca em Tempo Real de Canais

**User Story:** Como usuário com uma playlist de 1000+ canais, eu quero digitar no campo de busca e ver os resultados filtrarem instantaneamente, sem recarregar a página, para que eu encontre o canal desejado sem rolar manualmente por longas listas.

#### Acceptance Criteria

1. WHEN o usuário digita no campo `#channel-search`, THE Search_Filter SHALL atualizar `state.query` e chamar `renderChannels()` em até 180 ms após a última tecla pressionada (debounce já existente).

2. THE Channel_List SHALL filtrar canais em memória (`state.channels`) comparando `state.query` contra `channel.name` usando `toLocaleLowerCase('pt-BR')`, sem realizar nenhuma requisição de rede.

3. WHEN `state.query` não está vazio, THE Channel_List SHALL exibir a contagem de resultados no elemento `#channel-count` no formato `(N)` onde N é o número de canais que correspondem ao filtro atual.

4. WHEN `state.query` produz zero resultados, THE Channel_List SHALL exibir a mensagem `"Nenhum canal encontrado."` no `#channel-list` E THE `#channel-count` SHALL exibir `(0)`.

5. WHEN o usuário limpa o campo `#channel-search` (valor resultante é string vazia), THE Channel_List SHALL chamar `renderChannels()` em até 180 ms, restaurando a listagem completa da categoria ativa; SE nenhuma categoria estiver ativa (`state.category === ''`), SHALL exibir todos os canais da playlist.

6. WHILE a playlist está carregada (`state.channels.length > 0`), THE Search_Filter SHALL filtrar `state.channels` em memória sem realizar nenhuma requisição de rede, produzindo os mesmos resultados independentemente do estado da conexão.

7. WHEN uma nova playlist é selecionada via `#player-playlist`, THE Search_Filter SHALL limpar `state.query` e o valor do `#channel-search` antes de carregar os canais da nova playlist.

8. WHEN o usuário digita no campo `#channel-search` com uma categoria ativa (`state.category !== ''`), THE Search_Filter SHALL aplicar simultaneamente o filtro de texto (`state.query`) e o filtro de categoria (`state.category`), exibindo apenas os canais que satisfazem ambos os critérios.

---

### Requirement 2: Indicador de Saúde do Canal (Health Indicator)

**User Story:** Como usuário que evita clicar em canais fora do ar, eu quero ver um indicador visual de status ao lado de cada canal na lista, para que eu saiba quais streams estão online antes de clicar.

#### Acceptance Criteria

1. THE Channel_Row SHALL exibir um Health_Indicator com três estados visuais distintos:
   - Verde (`status === 'online'`): stream verificado como disponível.
   - Vermelho (`status === 'offline'`): stream verificado como indisponível.
   - Cinza (`status === 'unknown'` ou ausente): status ainda não verificado.

2. WHEN a Channel_List é renderizada, THE Health_Indicator SHALL inicializar exibindo o valor do campo `Stream_Status` já presente no objeto de canal retornado por `/playlists/:id/channels`, sem realizar nenhuma verificação adicional no momento da renderização.

3. WHERE o Data_Saver_Mode está desabilitado (`localStorage.getItem('m3u-data-saver') !== 'true'`), WHEN a Channel_List termina de renderizar, THE Player SHALL iniciar uma verificação de status assíncrona para os canais visíveis no Visible_Viewport, usando o Probe_Speed_Endpoint em lotes de até 20 canais por requisição, sem bloquear o thread principal.

4. WHERE o Data_Saver_Mode está habilitado, THE Player SHALL utilizar exclusivamente o Stream_Status persistido no objeto do canal, sem realizar chamadas ao Probe_Speed_Endpoint.

5. WHEN o Probe_Speed_Endpoint retorna resultados `{ results: [{ id, status }] }`, THE Player SHALL para cada resultado localizar o elemento DOM `[data-channel-id="{id}"] .health-indicator` e atualizar seu atributo `data-status` e classe CSS correspondente, sem substituir o `innerHTML` de `#channel-list` ou de qualquer `Channel_Row`.

6. WHEN o Probe_Speed_Endpoint falha com erro de rede, THE Health_Indicator SHALL permanecer no estado cinza (`unknown`) para os canais afetados, sem exibir mensagem de erro ao usuário.

7. THE Player SHALL exibir um botão `#btn-data-saver` na toolbar do player; WHEN o usuário clica no botão, THE Player SHALL alternar o valor de `localStorage['m3u-data-saver']` entre `'true'` e `'false'` e atualizar o atributo `aria-pressed` do botão; WHEN `aria-pressed === 'true'`, THE Player SHALL cancelar quaisquer requisições pendentes ao Probe_Speed_Endpoint.

8. WHEN o usuário clica em um Channel_Row com `status === 'offline'`, THE Player SHALL iniciar o playback normalmente, pois o status pode estar desatualizado, e THE Health_Indicator daquele canal SHALL transicionar para cinza durante a tentativa.

9. WHERE o Data_Saver_Mode está desabilitado, THE Player SHALL usar `IntersectionObserver` para monitorar `Channel_Row`s; WHEN um `Channel_Row` entra no viewport pela primeira vez e seu `Stream_Status` é `'unknown'`, THE Player SHALL adicionar o `channel.id` ao lote pendente para envio ao Probe_Speed_Endpoint; THE Player SHALL enviar o lote após acumular 20 canais ou após 500 ms sem novos canais entrando no viewport, o que ocorrer primeiro.

---

### Requirement 3: EPG Inline no Player

**User Story:** Como usuário assistindo TV ao vivo, eu quero ver o nome do programa atual e o próximo diretamente na lista de canais, para que eu saiba o que está passando sem precisar abrir uma grade de programação separada.

#### Acceptance Criteria

1. WHEN dados EPG para um canal estão disponíveis no EPG_Cache (`epgCache.has(channel.name) === true`), THE Channel_Row correspondente SHALL exibir um elemento `<span class="epg-inline">` abaixo do nome do canal contendo o título do programa atual.

2. WHEN dados EPG não estiverem disponíveis no EPG_Cache para um canal, THE Channel_Row SHALL omitir o slot EPG_Inline, sem exibir espaço reservado ou indicador de carregamento.

3. WHEN o usuário navega para a página `#/player` e a Channel_List é exibida, THE Player SHALL iniciar o carregamento assíncrono de EPG para os canais visíveis no Visible_Viewport, usando o endpoint `GET /api/epg/now?name={channelName}`.

4. THE EPG_Cache SHALL armazenar os dados EPG de cada canal por nome (`channelName` como chave) e reutilizar os dados em cache para canais que já foram consultados durante a sessão atual, sem realizar nova requisição de rede para o mesmo canal.

5. WHEN dados EPG são recebidos do EPG_Manager para um canal, THE Player SHALL localizar o elemento DOM `[data-channel-name="{channelName}"] .epg-inline` e atualizar seu `textContent` com os novos dados; SE o elemento não existir no DOM, THE Player SHALL criá-lo e anexá-lo ao `Channel_Row` correspondente; em nenhum caso SHALL o `innerHTML` de `#channel-list` ser substituído.

6. WHEN a resposta de `/api/epg/now` retorna `{ hasEpg: false }`, THE Player SHALL inserir a chave do canal no EPG_Cache com valor `null` para evitar nova requisição; THE Channel_Row SHALL não exibir o elemento `.epg-inline`.

7. WHEN o canal selecionado muda (usuário clica em um novo Channel_Row), THE Player SHALL atualizar o EPG_Inline do canal anteriormente selecionado para remover o destaque de "em reprodução".

8. THE EPG_Inline SHALL exibir o título do programa atual truncado a 40 caracteres com reticências (`…`) SE o título exceder esse limite, seguido do horário de início e término no formato `HH:MM – HH:MM`, em um único elemento `<span class="epg-inline">` como segunda linha do `Channel_Row`.

9. WHEN o canal está selecionado (`state.selected?.url === ch.url`) E um programa EPG está em andamento (`epg.next` existe), THE EPG_Inline SHALL exibir um elemento adicional `<span class="epg-next">` com o texto `A seguir HH:MM: {título}` como terceira linha do `Channel_Row`; WHEN o canal não está selecionado, o elemento `.epg-next` SHALL estar oculto via CSS (`display: none`).

10. THE Player SHALL não realizar pré-fetch de EPG para canais de páginas ainda não exibidas (paginação), iniciando a carga EPG apenas quando a página correspondente da Channel_List estiver sendo exibida ao usuário.

11. IF a requisição a `/api/epg/now` exceder 3000 ms, THEN THE Player SHALL abortar a requisição usando `AbortController` e registrar `console.warn('[EPG] timeout:', channelName)`.

11b. IF a requisição a `/api/epg/now` falhar com erro de rede, THEN THE Player SHALL registrar `console.warn('[EPG] error:', channelName, error.message)` e THE Channel_Row SHALL não exibir o elemento `.epg-inline`.

---

### Requirement 4: Requisitos Não-Funcionais e de Compatibilidade

**User Story:** Como usuário em dispositivo móvel (Android/PWA) ou Smart TV, eu quero que as três melhorias funcionem sem degradar a performance do player, para que minha experiência de reprodução não seja comprometida.

#### Acceptance Criteria

1. THE Player SHALL garantir que as operações de busca (Requirement 1), atualização de Health_Indicator (Requirement 2) e atualização de EPG_Inline (Requirement 3) não bloqueiem o thread principal do JavaScript por mais de 50 ms em cada operação individual.

2. THE Player SHALL realizar atualizações de Health_Indicator e EPG_Inline somente via mutação direta de elementos DOM existentes (sem `innerHTML` da Channel_List inteira), para preservar o estado de rolagem e foco de acessibilidade.

3. THE Player SHALL animar transições de estado do Health_Indicator usando CSS `transition: background-color 300ms ease`; WHEN `prefers-reduced-motion: reduce` está ativo, THE Player SHALL aplicar `transition: none` ao `.health-indicator`, desativando a animação completamente.

4. WHEN elementos Health_Indicator ou EPG_Inline são adicionados a um Channel_Row, THE Player SHALL garantir que o elemento Channel_Row resultante permaneça detectável por `visibleTVTargets()` (atributo `data-tv-target` preservado) e que `focusTV()` possa focar o `Channel_Row` sem lançar exceção.

5. WHILE o modo TV (`tvMode`) estiver ativo e o foco estiver no `#channel-search`, THE Search_Filter SHALL aceitar entrada de texto sem interferir com o `numBuffer` de `automation.js`, garantindo que teclas numéricas direcionadas ao campo de busca não acionem a troca de canal por número.

6. THE Player SHALL manter a função `getBackendBase()` inalterada; WHEN Health_Indicator ou EPG_Inline realizam requisições de rede, SHALL usar `authFetch()` existente em `automation.js`, que internamente chama `getBackendBase()`, garantindo resolução correta da URL base em browser, PWA e Android/Capacitor sem código condicional adicional.

7. THE Health_Indicator e THE EPG_Inline SHALL aplicar estilos CSS usando as variáveis de design existentes (`--accent-solid`, `--green`, `--red`, `--muted`, `--ink`, `--surface-glass`, `--border`) do sistema de design `styles.css`/`design-v8.css`, sem introduzir novas variáveis CSS não documentadas.

8. WHERE o usuário está no contexto PWA (service worker ativo), THE Search_Filter SHALL continuar funcionando para filtrar canais já carregados em memória, independentemente da disponibilidade de rede para os endpoints EPG e de status.
