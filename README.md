## ⚙️ Setup

### 1. Clone the repository

```bash
git clone https://github.com/JosuePG/pokemon_trader.git
cd pokemon_trader
```
### 2. Install dependencies
```bash
npm install
```
### 3. Set up environment variables
Create a .env file in the root directory:
```bash
PORT=3000
MONGO_URI=mongodb://localhost:27017/pokemon_trader
JWT_SECRET=your_jwt_secret
POKEMON_COUNT=5
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://localhost
EMAIL_NOTIFICATIONS_ENABLED=false
```
### 4. Start Redis and RabbitMQ
```bash
sudo systemctl start redis
sudo systemctl start rabbitmq-server
```
### 5. Start the development server
```bash
npm start
```

### Run tests
```bash
npm test
```

### API Overview
#### Auth
##### POST /api/auth/register – Register a user and receive Pokémon
##### POST /api/auth/login – Authenticate and receive JWT

#### Pokémon
##### GET /api/pokemon – Get the logged-in user's Pokémon

#### Trades
##### POST /api/trades – Create a new trade request
##### GET /api/trades – List all trade requests
##### POST /api/trades/:id/accept – Accept a trade request
##### POST /api/trades/:id/reject – Reject a trade request

#### Ranking
##### GET /api/ranking – View leaderboard by successful trades

### Project Structure
```bash
src/
├── config/             # Environment config, Redis, RabbitMQ setup
├── controllers/        # Route logic and handlers
├── middleware/         # JWT auth, rate limiting
├── models/             # Mongoose schemas (User, Pokemon, Trade)
├── routes/             # Express route files
├── services/           # Email service, Pokémon fetching, trade logic
├── utils/              # Validation and helper utilities
├── index.ts            # App entry point
```

