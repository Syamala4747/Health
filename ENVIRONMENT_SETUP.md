# 🔐 Environment Variables Setup Guide

This guide will help you securely configure your API keys and environment variables.

## 🚨 IMPORTANT SECURITY NOTICE

**NEVER commit API keys to Git!** Always use environment variables for sensitive data.

## Backend Environment Setup

1. Create a `.env` file in the `backend/` directory:

```bash
# Copy the template
cp backend/.env.example backend/.env
```

2. Edit `backend/.env` and add your actual API keys:

```bash
# AI Services Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
HUGGINGFACE_API_KEY=your_huggingface_api_key_here

# Database Configuration
MONGODB_URI=your_mongodb_connection_string

# JWT Configuration
JWT_SECRET=your_secure_jwt_secret_here
```

## Frontend Environment Setup

1. The frontend already has a `.env` file. Edit it with your actual values:

```bash
# Add your OpenAI API key
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

## How to Get API Keys

### OpenRouter API Key
1. Go to [OpenRouter](https://openrouter.ai/)
2. Sign up/Login
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-or-v1-...`)

### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up/Login
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-proj-...`)

### HuggingFace API Key
1. Go to [HuggingFace](https://huggingface.co/)
2. Sign up/Login
3. Go to Settings → Access Tokens
4. Create a new token
5. Copy the token

## Security Best Practices

1. **Never commit `.env` files** - They're already in `.gitignore`
2. **Use different keys for development and production**
3. **Rotate keys regularly**
4. **Use minimal permissions for each key**
5. **Monitor API key usage**

## If You Accidentally Exposed a Key

1. **Immediately revoke the exposed key** from the provider's dashboard
2. **Generate a new key**
3. **Update your environment variables**
4. **Consider using git history rewriting tools** if the key was committed

## Environment Variable Loading

The applications automatically load environment variables from:
- `backend/.env` (for backend API)
- `frontend/.env` (for frontend app)

Make sure these files exist and contain your actual API keys before running the applications.