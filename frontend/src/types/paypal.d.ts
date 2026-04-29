interface PayPalActions {
  enable(): void
  disable(): void
  order: {
    create(opts: { purchase_units: Array<{ amount: { value: string } }> }): Promise<string>
    capture(): Promise<unknown>
  }
}

interface PayPalButtonsInstance {
  render(target: HTMLElement): Promise<void>
}

interface PayPalButtonsConfig {
  style?: { color?: string; shape?: string; layout?: string }
  onInit?(data: unknown, actions: PayPalActions): void
  createOrder?(data: unknown, actions: PayPalActions): Promise<string>
  onApprove?(data: unknown, actions: PayPalActions): Promise<void> | void
  onError?(err: unknown): void
}

interface PayPalSDK {
  Buttons(config: PayPalButtonsConfig): PayPalButtonsInstance
}

interface Window {
  paypal?: PayPalSDK
}
