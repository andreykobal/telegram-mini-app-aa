import { MoonPayProvider } from '@moonpay/moonpay-react';
import { MoonPayBuyWidget } from '@moonpay/moonpay-react';


const Buy = () => {
    return (
        <MoonPayProvider
            apiKey="pk_test_loke4jjtbByc64dGCPcxsmF3pGA"
            debug
        >
            <div className='moonpay-widget-container'>
                <MoonPayBuyWidget className='moonpay-widget'
                    variant="embedded"
                    baseCurrencyCode="usd"
                    baseCurrencyAmount="100"
                    defaultCurrencyCode="eth"
                    visible
                />
            </div>
        </MoonPayProvider>
    )
}

export default Buy;