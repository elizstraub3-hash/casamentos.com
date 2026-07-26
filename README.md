# Casamento Fernanda &amp; Alex 💍

Site para os convidados do casamento de **Fernanda &amp; Alex**.

**Data:** Sábado, 31 de outubro de 2026, às 15h
**Local:** Chácara Deon — Rua Inácio Torques, 881, Roseira, Colombo/PR

## Seções

- **Início (Hero)** — nomes dos noivos, data e botão de confirmação
- **Nossa História** — linha do tempo do casal
- **Contagem Regressiva** — tempo restante até o grande dia (ao vivo)
- **O Grande Dia** — data, local (com link para o mapa) e traje
- **Recados / Confirmação** — os convidados deixam mensagem e confirmam presença

## Como ver o site

Abra o arquivo `index.html` no navegador. Nenhuma instalação é necessária.

Para publicar online, faça o deploy da pasta em qualquer hospedagem estática
(GitHub Pages, Netlify, Vercel, etc.).

## Personalização

| O que mudar | Onde |
| --- | --- |
| Data da contagem regressiva | `script.js` → `WEDDING_DATE` |
| Nomes, história, textos | `index.html` |
| Cores e fontes | `styles.css` (variáveis em `:root`) |

> Observação: o formulário de recados é uma demonstração e salva as mensagens
> apenas no navegador do convidado (`localStorage`). Para receber os recados de
> verdade, conecte a um serviço de formulário (ex.: Formspree, Google Forms) ou
> a um back-end.
