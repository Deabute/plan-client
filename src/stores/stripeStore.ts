// stripeStore.ts ~ Copyright 2022 Paul Beaudet MIT License

import { Writable, writable } from 'svelte/store';
import type { prices, stripSub } from '../shared/interface';

const priceOptions: Writable<prices[]> = writable([]);
const subscriptions: Writable<stripSub[]> = writable([]);
const stripe: Writable<any | null> = writable(null);

export { priceOptions, stripe, subscriptions };
