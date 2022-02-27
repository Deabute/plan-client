// stripeStore.ts ~ Copyright 2022 Paul Beaudet MIT License

import { Writable, writable } from 'svelte/store';
import type {
  prices,
  stripeSub,
  stripePaymentMethod,
} from '../shared/interface';

const priceOptions: Writable<prices[]> = writable([]);
const subscriptions: Writable<stripeSub[]> = writable([]);
const paymentMethods: Writable<stripePaymentMethod[]> = writable([]);
const stripe: Writable<any | null> = writable(null);

export { priceOptions, stripe, subscriptions, paymentMethods };
