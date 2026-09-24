import { TEST_DATABASE_URL } from "../support/db";

process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.APP_URL = "http://localhost:3100";
process.env.AUTH_SECRET = "integration-test-secret-integration-test-secret";
process.env.PAYMENT_PROVIDER = "mock";
process.env.EMAIL_PROVIDER = "console";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_secret";
process.env.STRIPE_PRICE_PACK = "price_pack";
process.env.STRIPE_PRICE_PRO_MONTHLY = "price_pro_m";
process.env.STRIPE_PRICE_PRO_YEARLY = "price_pro_y";
process.env.STRIPE_PRICE_BUSINESS_MONTHLY = "price_biz_m";
process.env.STRIPE_PRICE_BUSINESS_YEARLY = "price_biz_y";
process.env.LEMONSQUEEZY_WEBHOOK_SECRET = "ls_test_secret";
process.env.LEMONSQUEEZY_VARIANT_PACK = "111";
process.env.LEMONSQUEEZY_VARIANT_PRO_MONTHLY = "222";
