const path = require("path");
const orders = require(path.resolve("src/data/orders-data"));
const nextId = require("../utils/nextId");

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName] && data[propertyName] !== "") {
      return next();
    }
    next({ status: 400, message: `Order must include a ${propertyName}` });
  };
}

function bodyDataHasDishes() {
  return function (req, res, next) {
    const { data = {} } = req.body;
    const dishes = data["dishes"];
    if (dishes) {
      if (!Array.isArray(dishes) || dishes.length === 0) {
        next({ status: 400, message: `Must include at least one dish` });
      }
      dishes.forEach((dish, index) => {
        const quantity = dish["quantity"];
        if (!quantity || !Number.isInteger(quantity) || quantity < 0) {
          next({ status: 400, message: `Dish ${index} must have a quantity that is an integer greater than 0` });
        }
      });
      return next();
    }
    next({ status: 400, message: `Must include a dish` });
  };
}

function list(req, res) {
  res.json({ data: orders });
}

function create(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    status: status,
    dishes: dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function orderExists(req, res, next) {
  const orderId = req.params.orderId;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order does not exist: ${orderId}`,
  });
}

function read(req, res) {
  res.json({ data: res.locals.order });
}

function orderIdMatch(req, res, next) {
  const { data: {id} = {} } = req.body;
  const orderId = req.params.orderId;
  if (!id || orderId === id) {
    return next();
  }
  next({
    status: 400,
    message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
  });
}

function bodyDataHasStatus() {
  return function (req, res, next) {
    const { data = {} } = req.body;
    const status = data["status"];
    const validStatus = ["pending", "preparing", "out-for-delivery", "delivered"];
    if (status && status !== "" && validStatus.includes(status)) {
      const orderStatus = res.locals.order.status;
      if (orderStatus === "delivered") {
        next({ status: 400, message: `A delivered order cannot be changed` });
      }
      return next();
    }
    next({ status: 400, message: `Order must have status of ${validStatus.join(", ")}` });
  };
}

function update(req, res) {
  const foundOrder = res.locals.order;
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  foundOrder.deliverTo = deliverTo;
  foundOrder.mobileNumber = mobileNumber;
  foundOrder.status = status;
  foundOrder.dishes = dishes;
  res.json({ data: foundOrder });
}

function destroy(req, res) {
  const foundOrder = res.locals.order;
  if (foundOrder.status !== "pending") {
    res.status(400).json({ error: "An order cannot be deleted unless it is pending"});
  }
  const index = orders.findIndex((order) => order.id === foundOrder.id);
  if (index > -1) {
    orders.splice(index, 1);
  }
  res.sendStatus(204);
}

module.exports = {
  list,
  create: [
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHasDishes(),
    create,
  ],
  read: [
    orderExists,
    read
  ],
  update: [
    orderExists,
    orderIdMatch,
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHasDishes(),
    bodyDataHasStatus(),
    update
  ],
  delete: [
    orderExists,
    destroy
  ],
}