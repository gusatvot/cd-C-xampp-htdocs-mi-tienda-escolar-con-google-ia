import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            // Opciones de Mongoose 6.x ya no son necesarias aquí
            // useNewUrlParser: true,
            // useUnifiedTopology: true,
            // useCreateIndex: true, // Tampoco es necesaria
        });
        console.log(`MongoDB Conectado: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error al conectar a MongoDB: ${error.message}`);
        process.exit(1); // Salir del proceso con falla
    }
};

export default connectDB;