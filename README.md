# Aquamarine-Utils

Expects 2-3 json files depending on the useDevMode variable in database_con.js
If useDevMode is true, it attempts to read "database_config.dev.json", else it attempts to read "database_config.json"

### JSON Structures
database_config.json/database_config.dev.json:
```json
{
    "database_host" : "127.0.0.1",
    "database_user" : "user",
    "database_password" : "password",
    "database" : "database"
}
```

endpoints.json:
```json
{
    "host_url" : "api.example.com",
    "portal_url" : "portal.example.com",
    "n3ds_url" : "n3ds.example.com",
    "api_url" : "api.example.com",
    "discovery_url" : "disc.example.com"
}
```
Subdomains aren't set in stone, but you get the general understanding of it.