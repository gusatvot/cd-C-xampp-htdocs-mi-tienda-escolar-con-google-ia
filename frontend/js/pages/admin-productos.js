// frontend/js/pages/admin-productos.js

import { inicializarUI, actualizarContadorCarrito } from '../common/ui.js';
import { isLoggedIn, getUserData, actualizarUIAuth } from '../common/auth.js';
// Importamos las funciones específicas de client.js
import { subirImagenes, crearProducto, actualizarProducto, getCategorias, getProductos } from '../api/client.js'; 

document.addEventListener('DOMContentLoaded', () => {
    inicializarUI();    
    actualizarUIAuth(); 
    actualizarContadorCarrito(); 

    const mensajeGlobalDiv = document.getElementById('mensaje-admin-producto');
    const formProductoAdminSection = document.querySelector('.form-producto-admin-section');
    const listaProductosAdminSection = document.querySelector('.lista-productos-admin-section');
    const tablaProductosContainer = document.getElementById('tabla-productos-admin-container');


    // --- 1. Protección de la Ruta: Solo para Administradores ---
    const userData = getUserData(); 
    if (!isLoggedIn() || !userData || userData.rol !== 'admin') {
        if (mensajeGlobalDiv) {
            mensajeGlobalDiv.textContent = "Acceso denegado. Esta sección es solo para administradores.";
            mensajeGlobalDiv.className = 'auth-error'; 
            mensajeGlobalDiv.style.display = 'block';
        } else {
            alert("Acceso denegado. Debes ser administrador para ver esta página.");
        }
        if(formProductoAdminSection) formProductoAdminSection.style.display = 'none';
        if(listaProductosAdminSection) listaProductosAdminSection.style.display = 'none';
        return; 
    }
    console.log("ADMIN-PRODUCTOS.JS: Acceso de administrador confirmado.");

    // --- 2. Referencias a Elementos del Formulario ---
    const formProducto = document.getElementById('form-admin-producto');
    const inputImagenesEl = document.getElementById('admin-prod-imagenes-input');
    const previsualizacionDiv = document.getElementById('previsualizacion-imagenes-admin');
    const selectCategoria = document.getElementById('admin-prod-categoria');
    const btnGuardarProducto = document.getElementById('btn-guardar-producto');
    const btnCancelarEdicion = document.getElementById('btn-cancelar-edicion'); 
    const h2TituloFormulario = formProductoAdminSection ? formProductoAdminSection.querySelector('h2') : null;
    const productoIdInputOculto = document.getElementById('admin-prod-id'); 

    let urlsImagenesSubidasParaGuardar = []; 
    let modoEdicion = false; // Para controlar si estamos creando o editando

    // --- 3. Cargar Categorías Dinámicamente en el Select ---
    async function cargarCategoriasSelect() { // Renombrada para evitar conflicto si hay otra 'cargarCategorias'
        if (!selectCategoria) return;
        try {
            console.log("ADMIN-PRODUCTOS.JS: Cargando categorías para el select...");
            const respuesta = await getCategorias(); // Usa la función específica
            if (respuesta && Array.isArray(respuesta)) {
                selectCategoria.innerHTML = '<option value="" disabled selected>Seleccione una categoría...</option>';
                respuesta.forEach(cat => {
                    if (cat.activa) { 
                        const option = document.createElement('option');
                        option.value = cat._id; 
                        option.textContent = cat.nombre;
                        selectCategoria.appendChild(option);
                    }
                });
                console.log("ADMIN-PRODUCTOS.JS: Categorías cargadas.");
            } else {
                console.warn("ADMIN-PRODUCTOS.JS: Respuesta de categorías no es un array o está vacía", respuesta);
            }
        } catch (error) {
            console.error("ADMIN-PRODUCTOS.JS: Error al cargar categorías:", error);
            if (mensajeGlobalDiv) {
                mensajeGlobalDiv.textContent = `Error al cargar categorías: ${error.message}`;
                mensajeGlobalDiv.className = 'auth-error';
                mensajeGlobalDiv.style.display = 'block';
            }
        }
    }
    cargarCategoriasSelect(); 

    // --- 4. Manejar la Selección y Subida de Archivos de Imagen ---
    if (inputImagenesEl && previsualizacionDiv) {
        inputImagenesEl.addEventListener('change', async (event) => {
            const files = event.target.files;
            if (!files.length) {
                previsualizacionDiv.innerHTML = ''; 
                urlsImagenesSubidasParaGuardar = [];
                return;
            }
            previsualizacionDiv.innerHTML = '<p>Subiendo imágenes, por favor espere...</p>';
            urlsImagenesSubidasParaGuardar = []; 

            const formData = new FormData();
            for (let i = 0; i < files.length; i++) {
                formData.append('imagenes', files[i]); 
            }

            try {
                console.log("ADMIN-PRODUCTOS.JS: Intentando subir imágenes...");
                const responseUrls = await subirImagenes(formData); // Usa la función específica

                if (responseUrls && Array.isArray(responseUrls) && responseUrls.length > 0) {
                    urlsImagenesSubidasParaGuardar = responseUrls;
                    previsualizacionDiv.innerHTML = '<h4>Imágenes cargadas (previsualización):</h4>';
                    urlsImagenesSubidasParaGuardar.forEach((url, index) => {
                        // ... (código de previsualización como lo tenías) ...
                        const imgContainer = document.createElement('div');
                        imgContainer.style.cssText = 'display: inline-block; position: relative; margin: 5px; border: 1px solid #ccc; padding: 3px;';
                        const img = document.createElement('img');
                        img.src = url;
                        img.alt = `Previsualización ${index + 1}`;
                        img.style.cssText = 'width: 80px; height: 80px; object-fit: cover; display: block;';
                        imgContainer.appendChild(img);
                        previsualizacionDiv.appendChild(imgContainer);
                    });
                    console.log("ADMIN-PRODUCTOS.JS: URLs de imágenes obtenidas:", urlsImagenesSubidasParaGuardar);
                } else {
                    throw new Error("No se recibieron URLs válidas tras la subida.");
                }
            } catch (error) {
                console.error("ADMIN-PRODUCTOS.JS: Error subiendo imágenes:", error);
                previsualizacionDiv.innerHTML = `<p class="auth-error" style="color:red;">Error al subir: ${error.message}</p>`;
                inputImagenesEl.value = ''; 
            }
        });
    }

    // --- 5. Manejar el Envío del Formulario Principal del Producto ---
    if (formProducto) {
        formProducto.addEventListener('submit', async (event) => {
            event.preventDefault();
            if(btnGuardarProducto) {
                btnGuardarProducto.disabled = true;
                btnGuardarProducto.textContent = modoEdicion ? 'Actualizando...' : 'Guardando...';
            }
            if (mensajeGlobalDiv) mensajeGlobalDiv.style.display = 'none';

            const formData = new FormData(formProducto);
            const datosProducto = {};
            
            for (const [key, value] of formData.entries()) {
                // Excluir el input de archivo y el ID del producto si está vacío
                if (key === 'productImagesInput' || (key === 'productoId' && !value)) continue;

                if (key === 'destacado' || key === 'activo') {
                    datosProducto[key] = true; 
                } else if (key === 'precioBase') {
                    datosProducto[key] = parseFloat(value) || 0;
                } else if (key === 'stock') {
                    datosProducto[key] = parseInt(value, 10) || 0;
                } else { 
                    datosProducto[key] = value;
                }
            }
            if (!formData.has('destacado')) datosProducto.destacado = false;
            if (!formData.has('activo')) datosProducto.activo = false;

            // Si hay nuevas imágenes subidas, usarlas. Sino, no enviar el campo 'imagenes'
            // para que el backend no lo sobrescriba con un array vacío si estamos editando
            // y no se seleccionaron nuevas imágenes.
            if (urlsImagenesSubidasParaGuardar.length > 0) {
                datosProducto.imagenes = urlsImagenesSubidasParaGuardar; 
            } else if (!modoEdicion) { // Si es creación y no hay imágenes, enviar array vacío
                datosProducto.imagenes = [];
            }
            // Si es modo edición y no se subieron nuevas imágenes, no enviamos `datosProducto.imagenes`
            // para que el backend no borre las existentes. El backend debería manejar esto.

            const productoId = productoIdInputOculto ? productoIdInputOculto.value : null;
            console.log(`ADMIN-PRODUCTOS.JS: Datos a enviar para ${productoId ? 'actualizar' : 'crear'}:`, JSON.parse(JSON.stringify(datosProducto)));

            try {
                let productoGuardado;
                if (productoId) { // Modo Edición
                    productoGuardado = await actualizarProducto(productoId, datosProducto);
                } else { // Modo Creación
                    productoGuardado = await crearProducto(datosProducto);
                }
                
                console.log("ADMIN-PRODUCTOS.JS: Producto guardado/actualizado:", productoGuardado);
                if(mensajeGlobalDiv){
                    mensajeGlobalDiv.textContent = `Producto "${productoGuardado.nombre}" ${productoId ? 'actualizado' : 'creado'} con éxito.`;
                    mensajeGlobalDiv.className = 'auth-exito';
                    mensajeGlobalDiv.style.display = 'block';
                }
                
                resetearFormulario();
                await cargarListaDeProductosAdmin(); // Actualizar la lista

            } catch (error) {
                console.error("ADMIN-PRODUCTOS.JS: Error al guardar el producto:", error);
                 if(mensajeGlobalDiv){
                    mensajeGlobalDiv.textContent = `Error al guardar producto: ${error.message}`;
                    mensajeGlobalDiv.className = 'auth-error';
                    mensajeGlobalDiv.style.display = 'block';
                }
            } finally {
                if (btnGuardarProducto) {
                    btnGuardarProducto.disabled = false;
                    // El texto del botón se actualiza en resetearFormulario o setupModoEdicion
                }
            }
        });
    }

    function resetearFormulario() {
        if(formProducto) formProducto.reset();
        if(previsualizacionDiv) previsualizacionDiv.innerHTML = '';
        urlsImagenesSubidasParaGuardar = [];
        if(productoIdInputOculto) productoIdInputOculto.value = '';
        if(h2TituloFormulario) h2TituloFormulario.textContent = 'Crear Nuevo Producto';
        if(btnGuardarProducto) btnGuardarProducto.textContent = 'Guardar Producto';
        if(btnCancelarEdicion) btnCancelarEdicion.style.display = 'none';
        modoEdicion = false;
        if(inputImagenesEl) inputImagenesEl.value = ''; // Resetear el input de archivos
        if(mensajeGlobalDiv) mensajeGlobalDiv.style.display = 'none';
        selectCategoria.value = ""; // Resetear select de categoría
    }

    if(btnCancelarEdicion) {
        btnCancelarEdicion.addEventListener('click', resetearFormulario);
    }

    // --- 6. Cargar y Mostrar Lista de Productos Existentes ---
    async function cargarListaDeProductosAdmin() {
        if (!tablaProductosContainer) return;
        tablaProductosContainer.innerHTML = "<p>Cargando lista de productos...</p>";
        try {
            const data = await getProductos({ pageSize: 100 }); // Obtener hasta 100 productos
            if (data.productos && data.productos.length > 0) {
                let tablaHTML = `
                    <table class="tabla-general" style="width:100%; border-collapse: collapse;">
                        <thead>
                            <tr>
                                <th style="border:1px solid #ddd; padding:8px;">Imagen</th>
                                <th style="border:1px solid #ddd; padding:8px;">Nombre</th>
                                <th style="border:1px solid #ddd; padding:8px;">SKU</th>
                                <th style="border:1px solid #ddd; padding:8px;">Precio</th>
                                <th style="border:1px solid #ddd; padding:8px;">Stock</th>
                                <th style="border:1px solid #ddd; padding:8px;">Activo</th>
                                <th style="border:1px solid #ddd; padding:8px;">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                `;
                data.productos.forEach(p => {
                    const primeraImagen = (p.imagenes && p.imagenes.length > 0) ? p.imagenes[0] : 'img/productos/placeholder.jpg';
                    tablaHTML += `
                        <tr data-idproducto="${p._id}">
                            <td style="border:1px solid #ddd; padding:8px;"><img src="${primeraImagen}" alt="${p.nombre}" style="width:50px; height:50px; object-fit:cover;"></td>
                            <td style="border:1px solid #ddd; padding:8px;">${p.nombre}</td>
                            <td style="border:1px solid #ddd; padding:8px;">${p.sku}</td>
                            <td style="border:1px solid #ddd; padding:8px;">${p.precioBase}</td>
                            <td style="border:1px solid #ddd; padding:8px;">${p.stock}</td>
                            <td style="border:1px solid #ddd; padding:8px;">${p.activo ? 'Sí' : 'No'}</td>
                            <td style="border:1px solid #ddd; padding:8px;">
                                <button class="btn btn-sm btn-outline btn-editar-producto" data-id="${p._id}">Editar</button>
                                <!-- TODO: Botón Eliminar -->
                            </td>
                        </tr>
                    `;
                });
                tablaHTML += `</tbody></table>`;
                tablaProductosContainer.innerHTML = tablaHTML;
            } else {
                tablaProductosContainer.innerHTML = "<p>No hay productos para mostrar.</p>";
            }
        } catch (error) {
            console.error("Error cargando lista de productos admin:", error);
            tablaProductosContainer.innerHTML = `<p class="auth-error" style="color:red;">Error al cargar productos: ${error.message}</p>`;
        }
    }
    cargarListaDeProductosAdmin();

    // --- 7. Lógica para Editar Producto (cuando se hace clic en "Editar" de la lista) ---
    if (tablaProductosContainer) {
        tablaProductosContainer.addEventListener('click', async (event) => {
            const btnEditar = event.target.closest('.btn-editar-producto');
            if (btnEditar) {
                const idProductoAEditar = btnEditar.dataset.id;
                console.log("ADMIN-PRODUCTOS.JS: Editando producto ID:", idProductoAEditar);
                try {
                    const producto = await getProductoById(idProductoAEditar); // Usar client.js
                    if (producto) {
                        // Llenar el formulario con los datos del producto
                        if (productoIdInputOculto) productoIdInputOculto.value = producto._id;
                        formProducto.elements['nombre'].value = producto.nombre || '';
                        formProducto.elements['descripcion'].value = producto.descripcion || '';
                        formProducto.elements['sku'].value = producto.sku || '';
                        formProducto.elements['marca'].value = producto.marca || '';
                        formProducto.elements['categoria'].value = producto.categoria?._id || producto.categoria || ''; // Si categoria es populada o solo ID
                        formProducto.elements['precioBase'].value = producto.precioBase || 0;
                        formProducto.elements['stock'].value = producto.stock || 0;
                        formProducto.elements['unidadVenta'].value = producto.unidadVenta || '';
                        formProducto.elements['destacado'].checked = producto.destacado || false;
                        formProducto.elements['activo'].checked = producto.activo === undefined ? true : producto.activo; // Activo por defecto si no viene

                        // Manejar previsualización de imágenes existentes
                        urlsImagenesSubidasParaGuardar = producto.imagenes || []; // Guardar las URLs existentes
                        previsualizacionDiv.innerHTML = '<h4>Imágenes Actuales:</h4>';
                        if (urlsImagenesSubidasParaGuardar.length > 0) {
                            urlsImagenesSubidasParaGuardar.forEach((url, index) => {
                                // ... (código de previsualización como en la subida) ...
                                const imgContainer = document.createElement('div'); /* ... */ imgContainer.style.cssText = 'display: inline-block; position: relative; margin: 5px; border: 1px solid #ccc; padding: 3px;'; const img = document.createElement('img'); img.src = url; img.alt = `Imagen ${index + 1}`; img.style.cssText = 'width: 80px; height: 80px; object-fit: cover; display: block;'; imgContainer.appendChild(img); previsualizacionDiv.appendChild(imgContainer);
                            });
                        } else {
                            previsualizacionDiv.innerHTML += '<p>Este producto no tiene imágenes cargadas.</p>';
                        }
                        if(inputImagenesEl) inputImagenesEl.value = ''; // Limpiar selector de archivos


                        if(h2TituloFormulario) h2TituloFormulario.textContent = `Editando Producto: ${producto.nombre}`;
                        if(btnGuardarProducto) btnGuardarProducto.textContent = 'Actualizar Producto';
                        if(btnCancelarEdicion) btnCancelarEdicion.style.display = 'block';
                        modoEdicion = true;
                        window.scrollTo({ top: formProducto.offsetTop - 20, behavior: 'smooth' }); // Scroll hacia el formulario
                    }
                } catch (error) {
                    console.error("Error al cargar datos del producto para editar:", error);
                    if(mensajeGlobalDiv) {
                        mensajeGlobalDiv.textContent = `Error al cargar producto para editar: ${error.message}`;
                        mensajeGlobalDiv.className = 'auth-error';
                        mensajeGlobalDiv.style.display = 'block';
                    }
                }
            }
        });
    }

});