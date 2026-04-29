import type { Page } from '@playwright/test'

/**
 * Stub the PayPal SDK before the page loads. Checkout's useEffect looks for
 * `window.paypal` and only injects the <script> tag when it's missing — so we
 * pre-seed `window.paypal` with a minimal Buttons() implementation that:
 *   - records an `onInit` callback whose `actions.disable/enable` we mirror to
 *     the rendered container's `data-paypal-state` attribute (so tests can
 *     assert on it via DOM, not via window globals).
 *   - never makes a real network call.
 *
 * We also block any direct request to www.paypal.com just in case the SDK
 * stub is bypassed (defense in depth).
 */
export async function stubPayPal(page: Page): Promise<void> {
  await page.route('**://www.paypal.com/**', (route) => route.abort())

  await page.addInitScript(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).paypal = {
      Buttons: (config: {
        onInit?: (
          data: unknown,
          actions: { enable: () => void; disable: () => void },
        ) => void
      }) => {
        let container: HTMLElement | null = null
        const setState = (state: 'enabled' | 'disabled') => {
          if (container) container.setAttribute('data-paypal-state', state)
        }
        const actions = {
          enable: () => setState('enabled'),
          disable: () => setState('disabled'),
        }

        return {
          render: (target: string | HTMLElement) => {
            container =
              typeof target === 'string'
                ? document.querySelector<HTMLElement>(target)
                : target
            if (container) {
              const btn = document.createElement('button')
              btn.type = 'button'
              btn.textContent = 'Pay with PayPal (stub)'
              btn.setAttribute('data-testid', 'paypal-stub-button')
              container.innerHTML = ''
              container.appendChild(btn)
              container.setAttribute('data-paypal-stub', 'true')
              setState('disabled')
            }
            // Fire onInit asynchronously so React's effect that registers
            // input listeners has flushed first.
            queueMicrotask(() => config.onInit?.({}, actions))
            return Promise.resolve()
          },
        }
      },
    }
  })
}
