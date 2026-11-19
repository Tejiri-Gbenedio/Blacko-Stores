import json
from playwright.sync_api import sync_playwright

PAGES = ["https://blacko-stores.vercel.app/about", "https://blacko-stores.vercel.app/contact", "https://blacko-stores.vercel.app/shop"]

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        # Mobile viewport: 390 x 844
        context = browser.new_context(
            viewport={"width": 390, "height": 844},
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1"
        )
        page = context.new_page()

        for url in PAGES:
            print(f"\n==========================================")
            print(f"Inspecting LIVE: {url}")
            print(f"==========================================")
            page.goto(url, wait_until="networkidle")
            page.wait_for_timeout(1500)

            diag = page.evaluate('''() => {
                const getMetrics = (sel) => {
                    const el = document.querySelector(sel);
                    if (!el) return null;
                    const rect = el.getBoundingClientRect();
                    const style = window.getComputedStyle(el);
                    const parent = el.parentElement;
                    const parentRect = parent ? parent.getBoundingClientRect() : null;
                    const parentStyle = parent ? window.getComputedStyle(parent) : null;
                    return {
                        tag: el.tagName,
                        className: el.className,
                        rect: { left: rect.left, right: rect.right, width: rect.width, x: rect.x },
                        paddingLeft: style.paddingLeft,
                        paddingRight: style.paddingRight,
                        marginLeft: style.marginLeft,
                        marginRight: style.marginRight,
                        parentTag: parent ? parent.tagName : null,
                        parentClass: parent ? parent.className : null,
                        parentRect: parentRect ? { left: parentRect.left, right: parentRect.right, width: parentRect.width } : null,
                        parentPaddingLeft: parentStyle ? parentStyle.paddingLeft : null,
                        parentPaddingRight: parentStyle ? parentStyle.paddingRight : null,
                    };
                };

                return {
                    scrollWidth: document.documentElement.scrollWidth,
                    innerWidth: window.innerWidth,
                    clientWidth: document.documentElement.clientWidth,
                    bodyScrollWidth: document.body.scrollWidth,
                    h1: getMetrics('h1'),
                    firstP: getMetrics('main p, section p'),
                    footer: getMetrics('footer'),
                    footerFirstText: getMetrics('footer p, footer a, footer span'),
                };
            }''')

            print(json.dumps(diag, indent=2))

        browser.close()

if __name__ == "__main__":
    main()
