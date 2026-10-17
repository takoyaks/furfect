<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>503 — System Maintenance Underway</title>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <style>
            *, *::before, *::after {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
            }
            body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                background-color: #fafafa;
                color: #18181b;
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: space-between;
                padding: 2.5rem 1rem;
            }
            @media (prefers-color-scheme: dark) {
                body {
                    background-color: #09090b;
                    color: #fafafa;
                }
            }
            header, footer {
                width: 100%;
                max-width: 56rem;
                display: flex;
                align-items: center;
            }
            header {
                justify-content: flex-start;
            }
            footer {
                justify-content: center;
                font-size: 0.75rem;
                color: #71717a;
                text-align: center;
            }
            .brand {
                display: inline-flex;
                align-items: center;
                gap: 0.625rem;
                text-decoration: none;
                color: inherit;
                font-weight: 700;
                font-size: 0.95rem;
            }
            .brand img {
                width: 2.25rem;
                height: 2.25rem;
            }
            main {
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                max-width: 32rem;
                margin: auto;
                padding: 1.5rem;
            }
            .icon-wrapper {
                width: 5rem;
                height: 5rem;
                background: linear-gradient(135deg, #FEF3C7, #FDE68A);
                border: 2px solid #F59E0B;
                border-radius: 9999px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 1.5rem;
                box-shadow: 0 10px 25px -5px rgba(245, 158, 11, 0.25);
            }
            .icon-wrapper svg {
                width: 2.5rem;
                height: 2.5rem;
                color: #B45309;
            }
            .status-tag {
                display: inline-flex;
                align-items: center;
                gap: 0.375rem;
                font-size: 0.75rem;
                font-weight: 700;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                background-color: #FEF3C7;
                color: #92400E;
                padding: 0.25rem 0.75rem;
                border-radius: 9999px;
                margin-bottom: 1rem;
                border: 1px solid #FDE68A;
            }
            .status-tag::before {
                content: '';
                display: inline-block;
                width: 0.5rem;
                height: 0.5rem;
                border-radius: 9999px;
                background-color: #F59E0B;
                animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
            @keyframes pulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.4; transform: scale(0.85); }
            }
            h1 {
                font-size: 2.25rem;
                font-weight: 800;
                letter-spacing: -0.03em;
                margin-bottom: 0.75rem;
                line-height: 1.2;
            }
            p.description {
                font-size: 0.95rem;
                color: #52525b;
                line-height: 1.6;
                margin-bottom: 2rem;
            }
            @media (prefers-color-scheme: dark) {
                p.description {
                    color: #a1a1aa;
                }
            }
            .actions {
                display: flex;
                gap: 0.75rem;
                flex-wrap: wrap;
                justify-content: center;
            }
            .btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                padding: 0.75rem 1.5rem;
                font-size: 0.875rem;
                font-weight: 600;
                border-radius: 0.5rem;
                text-decoration: none;
                cursor: pointer;
                transition: all 0.15s ease;
            }
            .btn-primary {
                background-color: #283F24;
                color: #ffffff;
                border: 1px solid transparent;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            .btn-primary:hover {
                background-color: #395933;
                transform: translateY(-1px);
            }
        </style>
    </head>
    <body>
        <header>
            <a href="/" class="brand">
                <img src="/favicon.svg" alt="FurFect Match Logo">
                <span>FurFect Match</span>
            </a>
        </header>

        <main>
            <div class="icon-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                </svg>
            </div>
            
            <div class="status-tag">System Maintenance Mode</div>
            <h1>We'll be right back!</h1>
            <p class="description">
                FurFect Match is currently undergoing scheduled system updates and maintenance. We are tuning our systems to ensure the best possible experience for our animal shelters and pet adopters. We will be back online shortly!
            </p>
            
            <div class="actions">
                <button type="button" class="btn btn-primary" onclick="window.location.reload()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Check Again
                </button>
            </div>
        </main>

        <footer>
            <p>&copy; {{ date('Y') }} FurFect Match &bull; Municipal Animal Shelter Administration</p>
        </footer>
    </body>
</html>
