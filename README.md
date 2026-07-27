# Casamento Fernanda &amp; Alex 💍

Site para os convidados do casamento de **Fernanda &amp; Alex**.

**Data:** Sábado, 31 de outubro de 2026, às 15h
**Local:** Chácara Deon — Rua Inácio Torques, 881, Roseira, Colombo/PR

## Seções

- **Início (Hero)** — nomes dos noivos, data e botão de confirmação
- **Nossa História** — linha do tempo do casal
- **Contagem Regressiva** — tempo restante até o grande dia (ao vivo)
- **O Grande Dia** — data, local (com link para o mapa) e traje
- **Presente via Pix** — chave Pix (CPF), botão "copiar chave", Pix Copia e Cola e QR Code
- **Confirmação de presença** — o convidado confirma e deixa um recado
- **Mural de Recados** — mostra ao vivo os recados de todos os convidados
- **Painel dos Noivos** (`admin.html`) — área com login para ver quem confirmou

## Como ver o site

Abra o arquivo `index.html` no navegador. Nenhuma instalação é necessária.

Para publicar online, faça o deploy da pasta em qualquer hospedagem estática
(GitHub Pages, Netlify, Vercel, etc.).

## Ativar os recados e o painel (Firebase) — passo a passo

Enquanto o Firebase não é configurado, o site funciona em **modo demonstração**
(os recados ficam salvos só no navegador). Para valer para todos os convidados:

1. Acesse **console.firebase.google.com** e crie um projeto (ex.: "casamento-fernanda-alex").
2. No projeto, crie um **App da Web** (ícone `</>`). Copie o objeto `firebaseConfig`.
3. Cole esses dados no arquivo **`firebase-config.js`** (substituindo os `COLE_AQUI...`).
4. No menu **Criação → Firestore Database**, clique em **Criar banco de dados**
   (modo de produção). Depois, na aba **Regras**, cole as regras abaixo e publique.
5. No menu **Criação → Authentication → Sign-in method**, ative **E-mail/senha**.
   Em **Users**, clique em **Adicionar usuário** e crie o seu login de noivos
   (e-mail + senha). Esse será o acesso ao painel.
6. Pronto! Publique o site novamente. Os recados aparecem no mural para todos, e
   você entra em **`/admin.html`** ("Painel dos noivos", link no rodapé) para ver
   as confirmações.

### Regras de segurança do Firestore

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /recados/{doc} {
      allow read: if true;
      allow create: if request.resource.data.nome is string
                    && request.resource.data.mensagem is string
                    && request.resource.data.mensagem.size() >= 50
                    && request.resource.data.mensagem.size() < 1000;
      allow update, delete: if request.auth != null;
    }
    match /confirmacoes/{doc} {
      allow create: if request.resource.data.nome is string
                    && request.resource.data.nome.size() > 0;
      allow read, update, delete: if request.auth != null;
    }
  }
}
```

Com essas regras: qualquer convidado pode **enviar** recado/confirmação e **ver o mural**,
mas só quem tem login (os noivos) consegue **ver as confirmações** e apagar recados.

## Personalização

| O que mudar | Onde |
| --- | --- |
| Data da contagem regressiva | `script.js` → `WEDDING_DATE` |
| Nomes, história, textos | `index.html` |
| Cores e fontes | `styles.css` (variáveis em `:root`) |
| Configuração do Firebase | `firebase-config.js` |
