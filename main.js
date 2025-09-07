const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger-output.json');
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const app = express();
const PORT = 3000;

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Middleware to parse JSON request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware to serve static files from a directory
app.use(express.static('public'));

app.set("view engine", "ejs");
app.set("views", "./views");

// Главная страница – все товары
app.get("/", async (req, res) => {
    const products = await prisma.product.findMany({
        include: { store: true }
    });
    const stores = await prisma.store.findMany();

    res.render("index", { products, stores });
});

// Страница товаров конкретного магазина
app.get("/store/:id", async (req, res) => {
    const storeId = parseInt(req.params.id);

    const products = await prisma.product.findMany({
        where: { storeId },
        include: { store: true }
    });
    const stores = await prisma.store.findMany();

    res.render("index", { products, stores });
});

// Страница корзины
app.get("/cart", (req, res) => {
    res.render("cart");
});

// Оформить заказ
app.post("/checkout", async (req, res) => {
    try {
        const cart = req.body.cart; // [{id, name, price, quantity}, ...]

        if (!cart || cart.length === 0) {
            return res.status(400).json({ error: "Корзина пуста" });
        }

        // Создаём заказ
        const order = await prisma.order.create({
            data: {
                items: {
                    create: cart.map((item) => ({
                        productId: parseInt(item.id),
                        quantity: item.quantity,
                        price: item.price
                    }))
                }
            },
            include: { items: true }
        });

        res.json({ success: true, order });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Ошибка при оформлении заказа" });
    }
});

app.listen(PORT, () => {
    console.log(`Example app listening at http://localhost:${PORT}`);
});
