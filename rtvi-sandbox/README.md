# Real-Time Voice Inference SDK Demo (Daily)


## Link local package

From `rtvi-client-js` and `rtvi-client-react`:

```shell
yarn link
```

## Run dev server

```bash
yarn
yarn link realtime-ai
yarn link realtime-ai-daily
yarn link realtime-ai-react
yarn run dev
# or from project root
yarn workspace rtvi-sandbox dev
```

Create a `.env.local` in your root with a custom baseURL if you are running your own infra:

```
VITE_BASE_URL=http://...
VITE_DAILY_API_KEY=YOUR_API_KEY
```
