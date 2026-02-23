// Simple Mock Banking API in Node.js (Express)
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3001;

app.use(bodyParser.json());

// Store API keys and their associated accounts
const apiKeys = new Map();
const INACTIVE_TIMEOUT = 1 * 60 * 1000; // 1 minute in milliseconds
const ACCOUNTS_PER_API_KEY = 10;

// Middleware to validate API key
const validateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
        return res.status(401).json({ error: 'API key is required' });
    }
    req.apiKey = apiKey;
    next();
};

// Middleware to clean up inactive API keys and update last accessed time
const cleanupInactiveApiKeys = () => {
    const now = Date.now();
    for (const [apiKey, data] of apiKeys.entries()) {
        if (now - data.lastAccessed > INACTIVE_TIMEOUT) {
            apiKeys.delete(apiKey);
        }
    }
};

// Middleware to run cleanup and update last accessed time
app.use((req, res, next) => {
    cleanupInactiveApiKeys();
    const apiKey = req.headers['x-api-key'];
    if (apiKey && apiKeys.has(apiKey)) {
        apiKeys.get(apiKey).lastAccessed = Date.now();
    }
    next();
});

// Initialize accounts for a new API key
const initializeApiKeyAccounts = (apiKey) => {
    const accounts = new Map();
    for (let i = 1; i <= ACCOUNTS_PER_API_KEY; i++) {
        accounts.set(i, {
            balance: 100,
            createdAt: new Date(),
            accountNumber: i
        });
    }
    apiKeys.set(apiKey, {
        accounts,
        lastAccessed: Date.now()
    });
    return accounts;
};

// Get accounts for API key (creates if doesn't exist)
const getAccountsForApiKey = (apiKey) => {
    if (!apiKeys.has(apiKey)) {
        return initializeApiKeyAccounts(apiKey);
    }
    return apiKeys.get(apiKey).accounts;
};

// Validate account number
const validateAccountNumber = (accountNumber) => {
    const num = parseInt(accountNumber);
    return !isNaN(num) && num >= 1 && num <= ACCOUNTS_PER_API_KEY;
};

// Get account balance
app.get('/balance', validateApiKey, (req, res) => {
    const accountNumber = parseInt(req.query.accountNumber);
    if (!accountNumber || !validateAccountNumber(accountNumber)) {
        return res.status(400).json({ error: 'Invalid account number. Must be between 1 and 10' });
    }

    const accounts = getAccountsForApiKey(req.apiKey);
    const account = accounts.get(accountNumber);

    res.json({
        accountNumber,
        balance: account.balance
    });
});

// Withdraw funds
app.post('/withdraw', validateApiKey, (req, res) => {
    const accountNumber = req.body.accountNumber;
    if (!accountNumber || !validateAccountNumber(accountNumber)) {
        return res.status(400).json({ error: 'Invalid account number. Must be between 1 and 10' });
    }

    const accounts = getAccountsForApiKey(req.apiKey);
    const account = accounts.get(accountNumber);
    const amount = parseFloat(req.body.amount);

    if (isNaN(amount)) {
        return res.status(400).json({ error: 'Invalid amount' });
    }

    // GOTCHA: Bug - negative withdrawals *increase* the balance
    if (amount < 0) {
        account.balance += Math.abs(amount);
        return res.status(200).json({
            accountNumber,
            balance: account.balance
        });
    }

    if (amount * 100 !== Math.floor(amount * 100)) {
        return res.status(400).json({ error: 'No fractional cents allowed' });
    }

    if (amount === 0) {
        return res.status(400).json({ error: 'Cannot withdraw zero' });
    }

    if (amount > account.balance) {
        return res.status(400).json({ error: 'Insufficient funds', balance: account.balance });
    }

    account.balance -= amount;
    res.json({
        message: 'Withdrawal successful',
        accountNumber,
        balance: account.balance
    });
});

// List all accounts for API key
app.get('/accounts', validateApiKey, (req, res) => {
    const accounts = getAccountsForApiKey(req.apiKey);
    const accountList = Array.from(accounts.entries()).map(([number, account]) => ({
        accountNumber: number,
        balance: account.balance,
        createdAt: account.createdAt
    }));
    res.json({ accounts: accountList });
});

app.listen(port, () => {
    console.log(`Mock Banking API running at http://localhost:${port}`);
}); 