const { app, supabase } = require('./app');

// Verificar que supabase está inicializado
console.log('Supabase inicializado en index:', !!supabase);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});