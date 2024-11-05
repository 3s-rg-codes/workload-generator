import Amqp from 'k6/x/amqp';
import Queue from 'k6/x/amqp/queue';
import { Random } from 'k6/x/random';
import { shuffle } from 'k6/x/random';
import encoding from 'k6/encoding';

export default function () {
    const rabbitmqUrl = 'amqp://default_user_R2FyGcaNfptuccG1Q9I:avE5SLyCsFsVysLDzmq_FM9vbJvjaxEF@host.docker.internal:5672';
    const queueName = 'my_new_queue';

    // Start AMQP connection
    Amqp.start({ connection_url: rabbitmqUrl });
    console.log("Connection opened: " + rabbitmqUrl);

    // Declare the queue
    Queue.declare({
        name: queueName,
        durable: true,
        args: {
            'x-queue-type': 'quorum',
        },
    });

    console.log(queueName + " queue is ready");

    // Generate a random invoice
    const invoice = generateInvoice();

    // Create the CloudEvent
    const cloudEvent = {
        specversion: "1.0",
        id: "ABC-123",
        source: "invoice",
        type: "invoice",
        datacontenttype: "application/json",
        data_base64: encoding.b64encode(JSON.stringify(invoice))
    };

    // Publish the CloudEvent
    Amqp.publish({
        queue_name: queueName,
        body: JSON.stringify(cloudEvent),
        content_type: "application/json", // Use the correct content type
    });

    console.log("CloudEvent sent: " + JSON.stringify(cloudEvent));
}

function generateRandomDigits(length) {
    let digits = '';
    for (let i = 0; i < length; i++) {
        digits += Math.floor(Math.random() * 10);
    }
    return digits;
}

function generateInvoice() {
    let rng = new Random();

    const sellerNames = ['ABC Corp', 'XYZ Ltd', '123 LLC', 'Tech Innovations', 'Creative Solutions'];
    const buyerNames = ['Client A', 'Client B', 'Client C', 'Client D', 'Client E'];
    const itemDescriptions = ['Widget A', 'Gadget B', 'Service C', 'Product D', 'Tool E'];

    shuffle(sellerNames);
    const sellerName = sellerNames[0];

    shuffle(buyerNames);
    const buyerName = buyerNames[0];

    const items = [];
    const itemCount = rng.intBetween(1, 10);
    let baseAmount = 0;

    for (let i = 0; i < itemCount; i++) {
        const shuffledDescriptions = [...itemDescriptions];
        shuffle(shuffledDescriptions);
        const description = shuffledDescriptions[0];

        const quantity = rng.intBetween(1, 5);
        const price = rng.floatBetween(50.0, 500.0).toFixed(2);

        baseAmount += quantity * price;

        items.push({
            description: description,
            quantity: quantity,
            price: parseFloat(price),
            taxRate: 0.19,
        });
    }

    const taxAmount = baseAmount * 0.19;
    const totalAmountWithTax = (baseAmount + taxAmount).toFixed(2);

    return {
        seller: {
            name: sellerName,
            address: '123 Business St, Business City, BC 12345',
            iban: 'DE' + generateRandomDigits(20),
            bic: generateRandomDigits(8),
            bank: 'Business Bank',
        },
        buyer: {
            name: buyerName,
            address: '456 Client Ave, Client City, CC 67890',
        },
        taxNumber: `DE${generateRandomDigits(9)}`,
        invoiceDate: new Date().toISOString().split('T')[0],
        invoiceNumber: `INV-${rng.intBetween(1000, 9999)}`,
        items: items,
        deliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        totalAmount: {
            baseAmount: baseAmount.toFixed(2),
            taxRate: 0.19,
            taxAmount: taxAmount.toFixed(2),
            totalAmountWithTax: totalAmountWithTax,
        },
        discount: rng.floatBetween(0, 50).toFixed(2),
        isCreditNote: rng.boolean(),
        reverseCharge: rng.boolean(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };
}
