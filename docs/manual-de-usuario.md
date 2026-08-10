# Manual de Usuario — AguaVigía CTG

Bienvenido a AguaVigía CTG, la plataforma ciudadana de monitoreo de cortes de agua en Cartagena de Indias. Esta herramienta fue construida para que los ciudadanos tengan acceso transparente, rápido y colaborativo al estado del servicio en cada barrio.

---

## 1. Para el Ciudadano: Cómo usar la aplicación

AguaVigía está diseñada para funcionar de manera rápida incluso en redes móviles 3G, sin gastar muchos datos.

### 🗺️ El Mapa Principal
Al entrar a la aplicación, verás el mapa de Cartagena dividido por sectores (barrios). 
- **Colores:**
  - 🟢 **Azul/Verde:** El servicio fluye normalmente.
  - 🟡 **Naranja/Amarillo:** Hay intermitencia o cortes no oficiales reportados por vecinos.
  - 🔴 **Rojo:** Corte oficial confirmado por Acuacar o validado por el veedor.
- Si tocas tu barrio, verás un recuadro con el estado exacto y hace cuánto se actualizó la información.

### 📢 Cómo Reportar un Problema
Si en tu casa se fue el agua y el mapa aún dice que hay servicio, puedes avisarnos en solo dos toques:
1. Desde el menú principal, entra a **"Reportar"**.
2. Selecciona tu sector en la lista (puedes escribir para buscar más rápido).
3. Toca el botón rojo de **"Reportar corte"**. 
¡Listo! Tu reporte se suma al de tus vecinos. Cuando un barrio acumula 10 reportes en menos de 2 horas, cambia a estado de advertencia (amarillo) automáticamente.

### 🔔 Suscribirse a las Notificaciones
Si no quieres estar abriendo la aplicación a cada rato, ¡deja que nosotros te avisemos!
1. Toca el botón **"Avisos"** (o el ícono de la campanita) en la barra superior.
2. Ingresa tu correo electrónico y escoge los sectores de los que quieres recibir avisos (por ejemplo, tu barrio, el de tus papás y donde trabajas).
3. Te enviaremos un correo para confirmar que la dirección es tuya. Una vez confirmes, recibirás un correo cada vez que el agua se vaya o regrese en tus zonas elegidas.

---

## 2. Para el Veedor: Cómo administrar la plataforma

El Veedor Ciudadano es quien confirma los reportes vecinales y los contrasta con la información oficial. Para entrar al panel de administración, el veedor ingresa a `/veedor` con su contraseña.

### 🚨 Panel de Control y Reportes
- En la pestaña de **Reportes**, verás los barrios que tienen reportes ciudadanos activos.
- Si confirmas que el corte es real, puedes usar el botón para **Cambiar Estado** y ponerlo en "Corte Confirmado". Esto pintará el sector de rojo en el mapa de todos los ciudadanos.

### 📊 Estadísticas (M7)
En la sección de **Estadísticas**, puedes ver:
- Los 5 barrios más afectados históricamente.
- Qué días de la semana son los más propensos a cortes.
- La duración promedio (en horas) que tardan los cortes en resolverse.
Esto te permite tener datos duros a la hora de reclamarle a la empresa prestadora.

### 📓 Bitácora
Cada vez que el estado de un barrio cambia o un corte se confirma, el evento queda grabado permanentemente en la **Bitácora**. Estos datos son inmutables y sirven para la investigación y las veedurías formales del ICPSR.
