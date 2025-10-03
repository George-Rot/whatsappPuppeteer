# 📱 WhatsApp Bot - Puppeteer

Um bot simples para enviar mensagens pelo WhatsApp Web usando Puppeteer e interface de terminal.

## 🚀 Funcionalidades

- ✅ Conexão automática com WhatsApp Web
- ✅ Escaneamento de QR Code (no navegador)
- ✅ Listagem de contatos disponíveis
- ✅ Envio de mensagens via terminal
- ✅ Salvamento de sessão (não precisa escanear QR toda vez)
- ✅ Menu interativo no terminal
- ✅ Tratamento de erros e reconexão

## 📋 Pré-requisitos

- Node.js (versão 14 ou superior)
- npm ou yarn
- WhatsApp instalado no celular
- Conexão com internet

## 🛠️ Instalação

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Executar o bot:**
   ```bash
   npm start
   ```
   ou
   ```bash
   node index.js
   ```

## 📖 Como usar

### Primeira execução:

1. **Execute o comando:**
   ```bash
   npm start
   ```

2. **O navegador irá abrir automaticamente** com a página do WhatsApp Web

3. **Escaneie o QR Code** com seu celular:
   - Abra o WhatsApp no seu celular
   - Vá em Menu (⋮) > WhatsApp Web
   - Escaneie o QR Code que aparece no navegador

4. **Aguarde a conexão** - quando conectado, o menu aparecerá no terminal

### Menu Principal:

```
==================================================
📱 WHATSAPP BOT - MENU PRINCIPAL
==================================================
1. 📨 Enviar mensagem
2. 📋 Listar contatos
3. 🔄 Reconectar
4. ❌ Sair
==================================================
```

### Enviando mensagens:

1. Escolha a opção **1** (Enviar mensagem)
2. Selecione um contato da lista numerada
3. Digite sua mensagem
4. Pressione Enter para enviar

### Exemplo de uso:
```
Escolha uma opção: 1

📋 CONTATOS DISPONÍVEIS:
------------------------------
1. João Silva
2. Maria Santos
3. Grupo da Família
4. Pedro Costa
------------------------------
Escolha um contato (número): 2

📝 Enviando mensagem para: Maria Santos
Digite sua mensagem: Olá! Como você está?
✅ Mensagem enviada para Maria Santos!
```

## 🔧 Configurações Avançadas

### Estrutura de arquivos:
```
WhatsappQR/
├── index.js          # Arquivo principal
├── package.json      # Dependências
├── README.md         # Este arquivo
└── session/          # Dados da sessão (criado automaticamente)
```

### Modificações possíveis:

**Para alterar o número máximo de contatos exibidos:**
No arquivo `index.js`, linha ~70, altere:
```javascript
for (let i = 0; i < Math.min(chatElements.length, 20); i++) {
```

**Para executar em modo headless (sem interface gráfica):**
No arquivo `index.js`, linha ~18, altere:
```javascript
headless: true, // Mude de false para true
```

## 🚨 Importante

- **Primeira execução:** Sempre escaneie o QR Code no navegador que abrir
- **Sessão salva:** Após a primeira conexão, os dados ficam salvos na pasta `session/`
- **Não feche o navegador:** Mantenha a janela do Chrome aberta durante o uso
- **Internet:** Certifique-se de ter uma conexão estável com a internet

## 🛡️ Segurança

- Os dados da sessão ficam salvos localmente na pasta `session/`
- Não compartilhe essa pasta com outras pessoas
- Use apenas em computadores confiáveis
- O bot não coleta nem envia dados para servidores externos

## ❌ Troubleshooting

### Problema: QR Code não aparece
**Solução:** 
- Certifique-se de que o navegador abriu
- Aguarde alguns segundos para carregar
- Se necessário, execute `npm start` novamente

### Problema: "Timeout: Não foi possível conectar"
**Solução:**
- Verifique sua conexão com internet
- Escaneie o QR Code mais rapidamente
- Certifique-se de que o WhatsApp no celular está funcionando

### Problema: Contatos não aparecem
**Solução:**
- Aguarde alguns segundos após conectar
- Certifique-se de que há conversas recentes no WhatsApp Web
- Tente a opção "Reconectar" no menu

### Problema: Mensagem não é enviada
**Solução:**
- Verifique se o contato está online
- Certifique-se de que a mensagem não está vazia
- Tente reconectar e enviar novamente

## 📝 Dependências

- **puppeteer:** Para controlar o navegador Chrome
- **readline-sync:** Para interface interativa no terminal
- **qrcode-terminal:** Para exibir QR codes no terminal (não usado nesta versão)
- **fs-extra:** Para gerenciamento de arquivos de sessão

## 🤝 Contribuição

Sinta-se livre para:
- Reportar bugs
- Sugerir melhorias
- Fazer fork do projeto
- Criar pull requests

## ⚖️ Disclaimer

Este bot é para uso educacional e pessoal. Use com responsabilidade e respeite os termos de uso do WhatsApp.

---

**Criado com ❤️ usando Node.js e Puppeteer**