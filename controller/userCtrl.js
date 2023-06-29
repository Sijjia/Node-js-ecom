const { generateToken } = require("../config/jwtToken");
const User = require("../models/userModel")
const asyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMingodbid");
const { generateRefreshToken } = require("../config/refreshToken");
const jwt = require("jsonwebtoken");
const sendEmail = require("./emailCtrl")
const crypto = require("crypto")
//Создать нового пользователя
const createUser = asyncHandler(async (req, res) => {
    const email = req.body.email;
    const findUser = await User.findOne({ email: email });
    if(!findUser) {
        //Новый пользовтель
        const newUser = await User.create(req.body);
        res.json(newUser);
    }else {
       throw new Error("Polzovatel Sushestvuet");
    }
});

const loginUserCtrl = asyncHandler( async(req, res) => {
    const { email, password } = req.body;
    // найти пользователя, зареган или нет
    const findUser = await User.findOne({ email });
    if (findUser && (await findUser.isPasswordMatched(password))) {
        const refreshToken = await generateRefreshToken(findUser?._id);
        const updateuser = await User.findByIdAndUpdate(
            findUser.id, 
            {
                refreshToken: refreshToken,
            },
            { 
                new: true 
            }
        );
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            maxAge: 72 * 60 * 60 * 1000,
        })
        res.json({
            _id: findUser?._id,
            firstname: findUser?.firstname,
            lastname: findUser?.lastname,
            email: findUser?.email,
            mobile: findUser?.mobile,
            token: generateToken(findUser?._id),
        })
    } else {
        throw new Error("Неправильные данные")
    }
})


// Обновить токен пользователя
const handleRefreshToken = asyncHandler(async (req, res) => {
    const cookie = req.cookies;
    console.log(cookie);
    if(!cookie?.refreshToken) throw new Error("Токен не обновился в Cookies")
    const refreshToken = cookie.refreshToken;
    console.log(refreshToken)
    const user = await User.findOne({ refreshToken });
    if(!user) throw new Error("В базе данных нет токена обновления или он не найден ")
    jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
        if (err || user.id !== decoded.id) {
            throw new Error ("Ошибка с обновленным токеном")
        }
        const accessToken = generateToken(user?._id)
        res.json({ accessToken })
    })
})


// Функция выхода
const logout = asyncHandler (async (req, res) => {
    const cookie = req.cookies;
    if(!cookie?.refreshToken) throw new Error("Токен не обновился в Cookies");
    const refreshToken = cookie.refreshToken;
    const user = await User.findOne({ refreshToken });
    if (!user) {
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: true,
        });
        return res.sendStatus(204); //forbidden
    }
    await User.findOneAndUpdate({ refreshToken: refreshToken }, {
        refreshToken: "",
    }); // создать объект фильтра, используя refreshToken, и передать его в findOneAndUpdate
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
    });
    res.sendStatus(204); //forbidden
})


// Получить всех пользователей
const getallUsers = asyncHandler(async(req, res) => {
    try {
        const getUsers = await User.find();
        res.json(getUsers);
    }
    catch (error) {
        throw new Error(error);
    };
});

// Обновить пользователя
const updatedUser = asyncHandler ( async (req, res ) => {
    console.log()
    const { _id } = req.user;
    validateMongoDbId(_id)
    try {
        const updatedUser = await User.findByIdAndUpdate(
            _id, {
            firstname: req?.body?.firstname,
            lastname: req?.body?.lastname,
            email: req?.body?.email,
            mobile: req?.body?.mobile,
        }, 
        {
            new: true
        });
        res.json(updatedUser)
    } catch (error) {
        throw new Error(error)
    }
})

// Получить одного пользователя
const getaUser = asyncHandler( async (req, res) => {
    const { id } = req.params;
    validateMongoDbId(id)
    try {
        const getaUser = await User.findById (id);
        res.json({
            getaUser, 
        })
    } catch (error) {
        throw new Error(error);
    }
})

// Удалить одного пользователя
const deleteaUser = asyncHandler( async (req, res) => {
    const { id } = req.params;
    validateMongoDbId(id)
    try {
        const deleteaUser = await User.findByIdAndDelete(id);
        res.json({
            deleteaUser, 
        })
    } catch (error) {
        throw new Error(error);
    }
})


//Заблокировать пользователя
const blockUser = asyncHandler (async (req, res) => {
    const {id} = req.params;
    validateMongoDbId(id)
    try {
        const block = await User.findByIdAndUpdate(
            id,
            {
                isBlocked: true,
            },
            {
                new: true
            }
        );
        res.json({
            message: "Polzovatel zablokirovan",
        })
    } catch (error) {
        throw new Error(error)
    }
})


//Разблокировать пользователя
const unblockUser = asyncHandler (async (req, res) => {
    const {id} = req.params;
    validateMongoDbId(id)
    try {
        const unblock = await User.findByIdAndUpdate(
            id,
            {
                isBlocked: false,
            },
            {
                new: true
            }
        );
        res.json({
            message: "Polzovatel razblokirovan",
        })
    } catch (error) {
        throw new Error(error)
    }
});

//обновление пароля
const updatePassword = asyncHandler(async (req, res) => {
    const { _id } = req.user
    const { password } = req.body;
    validateMongoDbId(_id)
    const user = await User.findById(_id)
    if ( password ) {
        user.password = password
        const updatedPassword = await user.save();
        res.json(updatedPassword);
    } else {
        res.json(user)
    }
})


//Токен забывшего пароля
const forgotPasswordToken = asyncHandler(async (req,res) => {
    const { email } = req.body
    const user = await User.findOne({ email });
    if(!user) throw new Error("Пользовтель не найден с этим email");
    try {
        const token = await user.createPasswordResetToken();
        await user.save();
        const resetURL = `Хай, Пожалуйста перейдите по ссылке что бы сбросить пароль <a href="http://localhost:5000/api/user/reset-password/${token}"> Нажмите сюда </a>`
        const data = {
            to: email,
            text: "Привет пользователь",
            subject: "Ссылка забыли пароль",
            htm: resetURL
        }
        sendEmail(data)
        res.json(token)
    } catch (error) {
        throw new Error (error)
    }
})


//Сброс пароля
const resetPassword = asyncHandler(async (req, res) => {
    const { password } = req.body;
    const { token } = req.params;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
    })
    if(!user) throw new Error ("Токен истек, попробуйте позже");
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    res.json(user)
})


module.exports = { 
    createUser,
    loginUserCtrl,
    getallUsers, 
    getaUser, 
    deleteaUser, 
    updatedUser, 
    blockUser, 
    unblockUser,
    handleRefreshToken,
    logout,
    updatePassword,
    forgotPasswordToken,
    resetPassword,
};