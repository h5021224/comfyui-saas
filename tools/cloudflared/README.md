# Cloudflare Tunnel for local ComfyUI

This folder keeps local-only Cloudflare Tunnel helpers for exposing ComfyUI.

## Quick tunnel for development

```powershell
.\tools\cloudflared\start-quick-tunnel.ps1
```

This starts a temporary `trycloudflare.com` URL for `http://localhost:8188`.
It is useful for smoke tests only. The URL is not stable and should not be used
for production.

## Named tunnel for production

Use a named tunnel and a custom hostname for production.

1. In Cloudflare Dashboard, open `Zero Trust > Networks > Tunnels`.
2. Create a Cloudflared tunnel named `comfyui`.
3. Choose the Windows connector and copy the install/run token command.
4. Configure the public hostname, for example:
   - Hostname: `comfyui-api.yourdomain.com`
   - Service: `http://localhost:8188`
5. Run the connector command on this Windows machine.
6. Set the app environment variable:

```env
COMFYUI_API_URL=https://comfyui-api.yourdomain.com
```

If you use the local config-file workflow instead, copy `config.example.yml` to
`config.yml`, replace the placeholders, then run:

```powershell
.\cloudflared.exe tunnel --config .\config.yml run comfyui
```

Do not commit `cloudflared.exe`, credentials JSON, certificates, logs, or
`config.yml`.
