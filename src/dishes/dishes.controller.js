const path = require("path");
const dishes = require(path.resolve("src/data/dishes-data"));
const nextId = require("../utils/nextId");

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName] && data[propertyName] !== "") {
      if (propertyName === "price" && (!Number.isInteger(data[propertyName]) || data[propertyName] < 0)) {
        next({ status: 400, message: `Dish must have a price that is an integer greater than 0` });
      }
      return next();
    }
    next({ status: 400, message: `Dish must include a ${propertyName}` });
  };
}

function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name: name,
    description: description,
    price: price,
    image_url: image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function list(req, res) {
  res.json({ data: dishes });
}

function dishExists(req, res, next) {
  const dishId = req.params.dishId;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish does not exist: ${dishId}`,
  });
}

function read(req, res) {
  res.json({ data: res.locals.dish });
}

function dishIdMatch(req, res, next) {
  const { data: {id} = {} } = req.body;
  const dishId = req.params.dishId;
  if (!id || dishId === id) {
    return next();
  }
  next({
    status: 400,
    message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
  });
}

function update(req, res) {
  const foundDish = res.locals.dish;
  const { data: { name, description, image_url, price } = {} } = req.body;
  foundDish.name = name;
  foundDish.description = description;
  foundDish.image_url = image_url;
  foundDish.price = price;
  res.json({ data: foundDish });
}

module.exports = {
  list,
  create: [
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("image_url"),
    bodyDataHas("price"),
    create
  ],
  read: [
    dishExists,
    read
  ],
  update: [
    dishExists,
    dishIdMatch,
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("image_url"),
    bodyDataHas("price"),
    update
  ],
}