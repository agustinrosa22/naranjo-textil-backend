const { Transaction, Product } = require('../db');
const { Op } = require('sequelize');

const sellProduct = async (req, res, next) => {
  try {
    const { productId, userId, cantidad, fecha, costo, vendedor, comentario, nombreProducto, image, tipo, clase, proveedor, costoPrevio } = req.body;

    // Verificar si el producto existe y está disponible
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    if (product.cantidad < cantidad) {
      return res.status(400).json({ message: 'No hay suficiente stock disponible' });
    }

    // Obtener la fecha actual si no se proporciona ninguna fecha
    const ventaFecha = fecha ? new Date(fecha) : new Date();

    // Crear la transacción con los campos adicionales
    const transaction = await Transaction.create({
      productId,
      userId,
      cantidad,
      fecha: ventaFecha,
      costo,
      vendedor,
      comentario,
      nombreProducto, 
      image, 
      tipo, 
      clase, 
      proveedor,
      costoPrevio, 
    });

    // Actualizar la cantidad de stock del producto
    product.cantidad -= cantidad;
    await product.save();

    res.status(201).json({ message: 'Venta realizada con éxito', transaction });
  } catch (error) {
    next(error);
  }
};

const getAllTransactions = async (req, res, next) => {
  try {
    const { startDate, endDate, tipo, clase } = req.query;

    // Definir opciones de consulta para filtrar por fechas
    const options = {};
    if (startDate && endDate) {
      options.where = {
        fecha: {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        },
      };
    } else if (startDate) {
      options.where = {
        fecha: {
          [Op.gte]: new Date(startDate),
        },
      };
    } else if (endDate) {
      options.where = {
        fecha: {
          [Op.lte]: new Date(endDate),
        },
      };
    }

        // Añadir filtro por tipo si existe
        if (tipo) {
          if (!options.where) {
            options.where = {};
          }
          options.where.tipo = tipo;
        }
    
        // Añadir filtro por clase si existe
        if (clase) {
          if (!options.where) {
            options.where = {};
          }
          options.where.clase = clase;
        }

    // Consultar las transacciones con las opciones de filtrado
    const transactions = await Transaction.findAll(options);
    // console.log(transactions)
    // Verificar si hay transacciones
    if (!transactions || transactions.length === 0) {
      return res.status(404).json({ message: 'No se encontraron transacciones' });
    }

    // Devolver las transacciones encontradas
    res.status(200).json({ transactions });
  } catch (error) {
    next(error);
  }
};

//http://tu-servidor/api/sell?startDate=2024-01-01&endDate=2024-01-31

// Controlador para eliminar una transacción de venta
const deleteTransaction = async (req, res, next) => {
  try {
    const { transactionId } = req.params; // Obtener el ID de la transacción a eliminar

    // Verificar si la transacción existe
    const transaction = await Transaction.findByPk(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: 'Transacción no encontrada' });
    }

    // Restaurar el stock del producto si es necesario
    const product = await Product.findByPk(transaction.productId);
    if (product) {
      product.cantidad += transaction.cantidad; // Restablecer la cantidad del producto
      await product.save();
    }

    // Eliminar la transacción
    await transaction.destroy();

    res.status(200).json({ message: 'Transacción eliminada con éxito' });
  } catch (error) {
    next(error); // Manejo de errores
  }
};


module.exports = {
  sellProduct,
  getAllTransactions,
  deleteTransaction,
};
