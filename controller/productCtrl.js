const Product = require("../models/productModel")
const asyncHandler = require("express-async-handler") // для обработки ошибок в асинхронных операциях
const slugify = require("slugify")

//Создание продукта
const createProduct = asyncHandler( async (req, res) => {
    try {
        if (req.body.title) {
            req.body.slug = slugify(req.body.title)
        }
        const newProduct = await Product.create(req.body) //С помощью await Product.create(req.body) создается новый продукт на основе данных, полученных из запроса (req.body).
    res.json (newProduct) //Если операция создания продукта проходит успешно, то возвращается созданный продукт в формате JSON с помощью res.json(newProduct)
    } catch (error) {
        throw new Error(error); //Если во время операции создания продукта возникает ошибка, она будет перехвачена блоком catch
    }
})

// Обновление Продукта
const updateProduct = asyncHandler(async( req, res ) => { //Объявление функции updateProduct, которая является асинхронной благодаря использованию async.
    const id = req.params.id; //Получение идентификатора продукта из параметров запроса: const id = req.params.id;. Идентификатор передается в URL-пути и извлекается с помощью req.params.
    try {
        if(req.body.title) {
            req.body.slug = slugify(req.body.title) //Если в запросе передано поле title, то создается slug на основе значения этого поля с помощью функции slugify
        }
        const updateProduct = await Product.findOneAndUpdate( //Используется метод findOneAndUpdate модели Product из библиотеки Mongoose для поиска и обновления продукта в базе данных.
            { _id: id }, // Первый аргумент - условие поиска (в данном случае по _id)
            req.body,  //второй аргумент - данные для обновления (содержимое req.body)
            { new: true } //третий аргумент - опции (в данном случае { new: true }, чтобы получить обновленную версию продукта).
        );
        res.json(updateProduct) //Отправка ответа с обновленным продуктом в формате JSON: res.json(updateProduct)
    } catch (error) {
        throw new Error(error) //Если происходит ошибка при обновлении продукта, она перехватывается и выбрасывается с помощью throw new Error(error)
    }
})

//Удаление продукта
const deleteProduct = asyncHandler(async( req, res ) => { 
    const id = req.params.id; 
    try {
        const deleteProduct = await Product.findOneAndDelete({ _id: id });
        res.json(deleteProduct) 
    } catch (error) {
        throw new Error(error) 
    }
})

//Получение продукта
const getaProduct = asyncHandler (async (req, res) => { //Объявление функции getProduct: Это асинхронная функция, которая принимает req (объект запроса) и res (объект ответа) в качестве параметров.
    const { id } = req.params; //Извлечение параметра id: Внутри функции из объекта запроса req извлекается параметр id, который предполагается передан в маршруте. Значение id будет использоваться для поиска продукта.
    try {
        const findProduct = await Product.findById(id); //Поиск продукта по id: Используя метод findById модели Product, происходит поиск продукта в базе данных по указанному id. Результат поиска сохраняется в переменную findProduct
        res.json(findProduct) //Отправка ответа: Если продукт найден успешно, сервер отправляет ответ клиенту в формате JSON с данными найденного продукта с помощью метода res.json(). Данные продукта будут возвращены в ответе.
    } catch (error) {
        throw new Error (error) //Обработка ошибок: Если происходит ошибка при поиске продукта, блок catch перехватывает ошибку и выбрасывает новую ошибку с полученным сообщением об ошибке
    }
});

// Получение всех продуктов
const getAllProducts = asyncHandler(async (req, res) => {
    try {
        //Фильтрация продуктов
        const queryObj = {...req.query};
        const excludeFields = ["page", "sort", "limit", "fields"]
        excludeFields.forEach(el => delete queryObj[el])
        console.log(queryObj)

        let queryStr = JSON.stringify(queryObj)
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
        
        let query = Product.find (JSON.parse(queryStr))

        //Сортировка
        if(req.query.sort) {
            const sortBy = req.query.sort.split(",").join(" ");
            query = query.sort(sortBy)
        } else {
            query = query.sort("-createdAt")
        }


        //Ограничевание полей
        if(req.query.fields) {
            const fields = req.query.fields.split(",").join(" ");
            query = query.select(fields)
        }  else {
            query = query.select("-__v")
        }

        //Пагинация
        const page = req.query.page;
        const limit = req.query.limit;
        const skip = (page -1) * limit;
        query = query.skip(skip).limit(limit);
        if(req.query.page) {
            const productCount = await Product.countDocuments();
            if(skip >= productCount) throw new Error("Этой страницы не существует")
        }
        console.log(page, limit, skip)



        const product = await query;
        res.json(product) //Если операция получения всех продуктов проходит успешно, то полученные продукты возвращаются в формате JSON с помощью res.json(getAllProducts)
    } catch (error) {
        throw new Error(error) //Если во время операции получения всех продуктов возникает ошибка, она будет перехвачена блоком catch
    }
})
module.exports = { createProduct, getaProduct, getAllProducts, updateProduct, deleteProduct}