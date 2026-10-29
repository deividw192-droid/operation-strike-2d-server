# OPERATION STRIKE 2D — servidor multiplayer

## Publicar no Render

1. Envie `server.js`, `package.json` e `README.md` para um repositório GitHub seu.
2. No Render, escolha **New + → Web Service** e conecte esse repositório.
3. Use:
   - Runtime/Language: **Node**
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: **Free**, se disponível.
4. Aguarde o serviço ficar **Live**.
5. Copie o domínio real do Render. No jogo, use `wss://SEU-DOMINIO.onrender.com` (substitua pelo seu domínio).

Este servidor retransmite mensagens entre dois jogadores por sala. Não armazena progresso ou contas. No plano gratuito, pode demorar a acordar após ficar ocioso.
