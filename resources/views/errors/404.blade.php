<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>404 — Page Not Found</title>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <style>
            *, *::before, *::after {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
            }
            body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                background-color: #ffffff;
                color: #18181b;
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: space-between;
                padding: 2rem 1rem;
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
            }
            .brand {
                display: inline-flex;
                align-items: center;
                gap: 0.625rem;
                text-decoration: none;
                color: inherit;
                font-weight: 600;
                font-size: 0.875rem;
            }
            .brand img {
                width: 2rem;
                height: 2rem;
            }
            main {
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                max-width: 28rem;
                margin: auto;
            }
            #lottie-box {
                width: 16rem;
                height: 16rem;
                margin-bottom: 0.5rem;
            }
            @media (min-width: 640px) {
                #lottie-box {
                    width: 18rem;
                    height: 18rem;
                }
            }
            .status-tag {
                font-size: 0.75rem;
                font-weight: 600;
                letter-spacing: 0.1em;
                text-transform: uppercase;
                color: #71717a;
                margin-bottom: 0.5rem;
            }
            h1 {
                font-size: 2rem;
                font-weight: 700;
                letter-spacing: -0.025em;
                margin-bottom: 0.5rem;
            }
            p.description {
                font-size: 0.875rem;
                color: #71717a;
                line-height: 1.5;
                margin-bottom: 2rem;
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
                padding: 0.625rem 1.25rem;
                font-size: 0.875rem;
                font-weight: 500;
                border-radius: 0.5rem;
                text-decoration: none;
                cursor: pointer;
                transition: background-color 0.15s ease, border-color 0.15s ease;
            }
            .btn-outline {
                border: 1px solid #e4e4e7;
                background-color: transparent;
                color: inherit;
            }
            .btn-outline:hover {
                background-color: #f4f4f5;
            }
            @media (prefers-color-scheme: dark) {
                .btn-outline {
                    border-color: #27272a;
                }
                .btn-outline:hover {
                    background-color: #18181b;
                }
            }
            .btn-primary {
                background-color: #283F24;
                color: #ffffff;
                border: 1px solid transparent;
            }
            .btn-primary:hover {
                background-color: #395933;
            }
        </style>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js"></script>
    </head>
    <body>
        <header>
            <a href="/" class="brand">
                <img src="/favicon.svg" alt="FurFect Match Logo">
                <span>FurFect Match</span>
            </a>
        </header>

        <main>
            <div id="lottie-box"></div>
            <div class="status-tag">404 Error</div>
            <h1>Page Not Found</h1>
            <p class="description">
                Sorry, we couldn't find the page you're looking for. It might have been moved or removed.
            </p>
            <div class="actions">
                <button type="button" class="btn btn-outline" onclick="window.history.length > 1 ? window.history.back() : window.location.href='/'">
                    Go Back
                </button>
                <a href="/" class="btn btn-primary">
                    Back to Home
                </a>
            </div>
        </main>

        <footer>
            <p>&copy; {{ date('Y') }} FurFect Match &bull; Virac Animal Welfare</p>
        </footer>

        <script>
            try {
                if (window.lottie) {
                    window.lottie.loadAnimation({
                        container: document.getElementById('lottie-box'),
                        renderer: 'svg',
                        loop: true,
                        autoplay: true,
                        path: '/animations/404cat.json'
                    });
                }
            } catch (e) {
                console.error(e);
            }
        </script>
    </body>
</html>
