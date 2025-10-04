const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Create session directory if it doesn't exist
const sessionDir = path.join(__dirname, 'whatsapp-session');
if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
    console.log('Created session directory:', sessionDir);
}

// Function to check if user is already logged in
async function isLoggedIn(page) {
    try {
        // Wait a bit for the page to load completely
        console.log('Checking if already logged in...');
        await page.waitForTimeout(5000);
        
        // First, check if we're on the main WhatsApp interface (logged in)
        const loggedInSelectors = [
            '[data-testid="chat-list"]',
            'div[id="pane-side"]',
            '[aria-label*="Chat list"]',
            'div[data-testid="side"]',
            'header[data-testid="chatlist-header"]'
        ];
        
        for (const selector of loggedInSelectors) {
            try {
                const element = await page.$(selector);
                if (element) {
                    console.log(`✓ User is already logged in! Found: ${selector}`);
                    return true;
                }
            } catch (error) {
                continue;
            }
        }
        
        // Check for QR code elements (not logged in)
        const qrElements = await page.$$('canvas');
        if (qrElements.length > 0) {
            console.log('QR code canvas found - user needs to scan');
            return false;
        }
        
        // Check page text for login indicators
        const pageText = await page.evaluate(() => document.body.innerText.toLowerCase());
        if (pageText.includes('scan') || pageText.includes('qr') || pageText.includes('code')) {
            console.log('QR code text detected - user needs to scan');
            return false;
        }
        
        if (pageText.includes('chat') || pageText.includes('message') || pageText.includes('conversa')) {
            console.log('Chat interface detected - user appears to be logged in');
            return true;
        }
        
        console.log('Login status unclear, assuming not logged in');
        return false;
        
    } catch (error) {
        console.log('Error checking login status:', error.message);
        return false;
    }
}

// Function to wait for QR code with multiple possible selectors
async function waitForQRCode(page) {
    const qrSelectors = [
        'canvas[aria-label*="QR"]',
        '[data-testid="qr-code"]',
        'canvas[role="img"]',
        'div[data-testid="qr-placeholder"]',
        'canvas',
        '._1MXsz', // old selector as fallback
        '[data-ref="qr-code"]'
    ];
    
    console.log('Trying to find QR code with various selectors...');
    
    for (const selector of qrSelectors) {
        try {
            console.log(`Trying selector: ${selector}`);
            await page.waitForSelector(selector, { timeout: 5000 });
            console.log(`✓ QR code found with selector: ${selector}`);
            return true;
        } catch (error) {
            console.log(`✗ Selector failed: ${selector}`);
            continue;
        }
    }
    
    // If none of the selectors work, wait for any canvas element or try text-based detection
    try {
        console.log('Trying to detect QR code by waiting for page to stabilize...');
        await page.waitForFunction(() => {
            // Look for canvas elements or QR-related text
            const canvases = document.querySelectorAll('canvas');
            const qrText = document.body.innerText.toLowerCase();
            return canvases.length > 0 || qrText.includes('qr') || qrText.includes('scan');
        }, { timeout: 10000 });
        console.log('✓ QR code area detected');
        return true;
    } catch (error) {
        throw new Error('Could not find QR code on WhatsApp Web. The page might have changed or there might be a connection issue.');
    }
}

// Function to find and click a contact with multiple approaches
async function clickContact(page, contactName) {
    const contactSelectors = [
        `span[title="${contactName}"]`,
        `span[title*="${contactName}"]`,
        `[data-testid="cell-frame-title"]:has-text("${contactName}")`,
        `div[aria-label*="${contactName}"]`
    ];
    
    for (const selector of contactSelectors) {
        try {
            console.log(`Trying to find contact with selector: ${selector}`);
            const element = await page.$(selector);
            if (element) {
            await element.click();
            console.log(`✓ Contact clicked with selector: ${selector}`);
            console.log(`LABEL: Contact selector used: ${selector}`);
            return true;
            }
        } catch (error) {
            console.log(`✗ Contact selector failed: ${selector}`);
            continue;
        }
    }
    
    // Try XPath approach as fallback
    try {
        console.log('Trying XPath approach for contact...');
        await page.waitForXPath(`//span[@title="${contactName}"]`, { timeout: 5000 });
        const [element] = await page.$x(`//span[@title="${contactName}"]`);
        if (element) {
            await element.click();
            console.log('✓ Contact clicked with XPath');
            return true;
        }
    } catch (error) {
        console.log('✗ XPath approach failed');
    }
    
    return false;
}

// Function to wait for chat to open
async function waitForChatToOpen(page) {
    const chatSelectors = [
        '[data-testid="conversation-compose-box-input"]',
        'div[contenteditable="true"][data-tab="10"]',
        'div[contenteditable="true"][data-tab="1"]',
        'div[role="textbox"]',
        '._3uMse', // old selector as fallback
        '[data-testid="msg-input"]'
    ];
    
    console.log('Waiting for chat to open...');
    
    for (const selector of chatSelectors) {
        try {
            await page.waitForSelector(selector, { timeout: 5000 });
            console.log(`✓ Chat opened, input found with selector: ${selector}`);
            return selector;
        } catch (error) {
            continue;
        }
    }
    
    throw new Error('Could not find chat input field');
}

// ===================================================================
// =================== NOVA FUNÇÃO ADICIONADA ========================
// ===================================================================
/**
 * Reads and prints all messages from the currently open chat.
 * @param {import('puppeteer').Page} page The Puppeteer page object.
 */
async function readChatMessages(page) {
    console.log('\n-----------------------------------');
    console.log('--- Reading Messages from Chat ---');
    console.log('-----------------------------------');
    try {
        // A robust selector for the element containing the message text
        const messageTextSelector = 'span.selectable-text.copyable-text';
        
        // Wait for at least one message element to be present in the chat
        await page.waitForSelector(messageTextSelector, { timeout: 10000 });
        await delay(1000); // A small delay to ensure more messages render

        // Use $$eval to grab the text from all message elements at once
        const messages = await page.$$eval(messageTextSelector, (elements) => {
            // Map each element to its text content
            return elements.map(el => el.textContent);
        });
        
        if (messages.length > 0) {
            messages.forEach((msg, index) => {
                // Print each message with a simple format
                console.log(`[Message ${index + 1}]: ${msg}`);
            });
        } else {
            console.log('No messages could be read from the chat.');
        }
        
    } catch (error) {
        console.error('Error reading chat messages:', error.message);
    } finally {
        console.log('-----------------------------------');
        console.log('---  Finished Reading Messages  ---');
        console.log('-----------------------------------\n');
    }
}
// ===================================================================
// ================= FIM DA NOVA FUNÇÃO ==============================
// ===================================================================


async function main() {
    let browser;
    try{
        console.log('Starting WhatsApp Web automation with persistent session...');
        
        // Launch browser with persistent user data directory
        browser = await puppeteer.launch({ 
            headless: false,
            userDataDir: sessionDir, // This makes the session persistent
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });
        
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        
        console.log('Loading WhatsApp Web...');
        await page.goto('https://web.whatsapp.com');
        
        // Check if already logged in
        const alreadyLoggedIn = await isLoggedIn(page);
        
        if (!alreadyLoggedIn) {
            console.log('Not logged in yet. Waiting for QR code or login interface...');
            
            // Wait for either QR code or login to appear
            try {
                await page.waitForFunction(() => {
                    // Check for QR code
                    const canvases = document.querySelectorAll('canvas');
                    if (canvases.length > 0) return true;
                    
                    // Check for login interface elements
                    const loginElements = document.querySelectorAll('[data-testid="chat-list"], div[id="pane-side"], [aria-label*="Chat list"]');
                    if (loginElements.length > 0) return true;
                    
                    // Check page text
                    const text = document.body.innerText.toLowerCase();
                    return text.includes('scan') || text.includes('qr') || text.includes('chat') || text.includes('message');
                }, { timeout: 15000 });
                
                // Re-check if logged in after waiting
                const nowLoggedIn = await isLoggedIn(page);
                if (nowLoggedIn) {
                    console.log('✓ User is now logged in!');
                } else {
                    console.log('Please scan the QR code with your phone to login...');
                    console.log('Waiting for login to complete...');
                    
                    // Wait for login to complete
                    await page.waitForFunction(() => {
                        return document.querySelector('[data-testid="chat-list"]') || 
                                document.querySelector('div[id="pane-side"]') ||
                                document.querySelector('[aria-label*="Chat list"]') ||
                                document.querySelector('header[data-testid="chatlist-header"]') ||
                                document.body.innerText.toLowerCase().includes('chat');
                    }, { timeout: 120000 }); // Wait up to 2 minutes for login
                    
                    console.log('✓ Login successful! Session will be saved for next time.');
                }
                
            } catch (error) {
                console.log('Timeout waiting for login interface. Please check WhatsApp Web manually.');
                console.log('Error:', error.message);
            }
        } else {
            console.log('✓ Using saved session - no QR code needed!');
        }
        
        await delay(2000);


        /*

        const contactName = 'Test';
        console.log(`Looking for contact: ${contactName}`);
        
        // Wait for WhatsApp to fully load and try multiple selectors for contact
        await page.waitForFunction(() => {
            return document.querySelector('[data-testid="chat-list"]') || 
                    document.querySelector('[aria-label*="Chat list"]') ||
                    document.querySelector('div[id="pane-side"]') ||
                    document.querySelector('span[title]');
        }, { timeout: 15000 });
        
        await delay(2000);
        
        // Try multiple approaches to find and click the contact
        const contactClicked = await clickContact(page, contactName);
        if (!contactClicked) {
            throw new Error(`Could not find contact: ${contactName}`);
        }
        
        console.log(`✓ Contact ${contactName} selected`);
        
        // Get the input field and send message
        const inputSelector = await waitForChatToOpen(page);
        const editor = await page.$(inputSelector);
        await editor.focus();

        const message = 'Hello, this is a test message!';
        
        console.log('Typing message...');
        await page.type(inputSelector, message);
        await delay(500);
        
        // Send the message (press Enter)
        await page.keyboard.press('Enter');
        console.log('✓ Message sent!');
        */


        // ===================================================================
        // =================== CHAMADA DA NOVA FUNÇÃO ========================
        // ===================================================================
        // Espera um pouco para a mensagem enviada aparecer no chat

        let ListContatos = await selector(page);
        
        //Requestar do BCD os contatos em ordem, visando a necessidade de acessar e dar gather nas mensagens

        


        await delay(3000);
        
        /*
        // Lê e exibe todas as mensagens do chat aberto
        
        await readChatMessages(page);
        // ==================================================================
        */

        console.log('Script finished successfully. Closing browser...');
        await browser.close();

    } catch (error) {
        console.error(error);
        if (browser) {
            await browser.close(); // Garante que o navegador feche em caso de erro
        }
    }
}

async function selector(page){
    
    const todosOsSpans = await page.$$('span._ao3e');
    let i = 0;
    let nullCount = 0;

    let Titulo = '';
    let Texto = '';
    let contato = '';
    let isGroup = false;


    for (const spanHandle of todosOsSpans) {
        const texto = await spanHandle.evaluate(el => el.textContent);
        const titulo = await spanHandle.evaluate(el => el.getAttribute('title'));

        if(titulo == "null" || titulo == null || titulo == undefined){
            nullCount++;
        }else{
            nullCount = 0;
            console.log(`Encontrado: Título="${Titulo}", Contato="${contato}", Texto="${Texto}"`);
            contato = '';
            Texto = '';
        }
        switch (nullCount) {
            case 0:
                Titulo = texto;
                break;
            case 1:
                Texto = texto;
                break;
            case 2:
                contato = Texto;
                Texto = texto;
                break;
        }
        i++;
        if(i == 54) break;
    }
    console.log(`Encontrado: Título="${Titulo}", Texto="${Texto}", Contato="${contato}"`);
    return todosOsSpans;
}

function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
}

// Function to clear session (logout)
function clearSession() {
    const fs = require('fs-extra');
    try {
        if (fs.existsSync(sessionDir)) {
            fs.removeSync(sessionDir);
            console.log('✓ Session cleared successfully');
        } else {
            console.log('No session found to clear');
        }
    } catch (error) {
        console.error('Error clearing session:', error);
    }
}

// Function to check if session exists
function hasSession() {
    return fs.existsSync(sessionDir) && fs.readdirSync(sessionDir).length > 0;
}

// Export functions for use in other files
module.exports = {
    main,
    clearSession,
    hasSession
};

// Add command line arguments support
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--clear-session')) {
        console.log('Clearing session...');
        clearSession();
        process.exit(0);
    }
    
    if (args.includes('--check-session')) {
        console.log('Session exists:', hasSession());
        process.exit(0);
    }
    
    // Run main function
    main().catch(console.error);
}