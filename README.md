# deSEC Traefik adapter

A tiny HTTP service that lets [Traefik](https://traefik.io) solve ACME DNS-01
challenges against [deSEC](https://desec.io).

Traefik has no built-in deSEC provider, but it does have the generic `httpreq`
provider, which POSTs each challenge to a URL of your choosing. This adapter is
that URL: it receives the challenge and writes the matching `_acme-challenge`
TXT record through the deSEC API.

It serves **every zone your deSEC token has access to** — one instance is enough
no matter how many domains you hold. The zone is resolved per request by asking
deSEC which domains the token owns and matching the longest one.

## Requirements

A deSEC API token with access to the zones you want certificates for. Create one
under *Token Management* at [desec.io](https://desec.io).

## Running it

```sh
echo 'DEDYN_TOKEN=your-desec-token' > .env
docker compose up -d
```

`DEDYN_TOKEN` is the only required variable. `HOST` and `PORT` default to
`127.0.0.1:1337`, and the bundled `docker-compose.yml` sets them to `0.0.0.0:8080`.

> **Do not expose this service publicly.** It has no authentication of its own,
> and anyone who can reach it can write DNS records in your zones. Keep it on an
> internal Docker network, reachable only by Traefik.

## Wiring up Traefik

Point the `httpreq` provider at the adapter and leave `HTTPREQ_MODE` unset —
this adapter speaks the default `{fqdn, value}` payload, not `RAW`.

```yaml
services:
  traefik:
    image: traefik:v3
    environment:
      - HTTPREQ_ENDPOINT=http://desec-proxy:8080
      - HTTPREQ_PROPAGATION_TIMEOUT=300
      - HTTPREQ_POLLING_INTERVAL=10
    # ...

  desec-proxy:
    build: .
    env_file: .env
    environment:
      - HOST=0.0.0.0
      - PORT=8080
```

Then declare the resolver in your static Traefik config:

```yaml
certificatesResolvers:
  desec:
    acme:
      email: you@example.com
      storage: /letsencrypt/acme.json
      dnsChallenge:
        provider: httpreq
```

And use it on a router, wildcards included:

```yaml
labels:
  - traefik.http.routers.whoami.tls.certresolver=desec
  - traefik.http.routers.whoami.tls.domains[0].main=example.com
  - traefik.http.routers.whoami.tls.domains[0].sans=*.example.com
```

deSEC's minimum TTL is applied automatically, so give propagation a generous
timeout — the values above are a reasonable starting point.

## API

| Method | Path       | Body                | Effect                                    |
| ------ | ---------- | ------------------- | ----------------------------------------- |
| `POST` | `/present` | `{ fqdn, value }`   | Appends `value` to the TXT rrset          |
| `POST` | `/cleanup` | `{ fqdn }`          | Deletes the TXT rrset                     |

## Development

```sh
npm ci
npm test
```

## License

MIT — see [LICENSE](LICENSE).
