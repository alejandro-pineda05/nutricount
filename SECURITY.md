# Sistema de PIN Seguro

## Configuración

Tu PIN está configurado en `.env.local`:
```
VITE_APP_PIN=TU_PIN_AQUI
```

### Cambiar tu PIN

Si quieres cambiar tu PIN:

1. Edita el archivo `.env.local` y reemplaza el valor de `VITE_APP_PIN`
2. Ejecuta:
```bash
npm run setup:pin
```

Esto hasheará tu nuevo PIN y lo guardará en Firestore.

## Características de Seguridad

✅ **PIN hasheado en Firestore**: El PIN no se almacena en texto plano
✅ **Rate Limiting**: Después de 5 intentos fallidos, se bloquea por 15 minutos
✅ **Almacenamiento local**: Los intentos fallidos se registran en localStorage

## Uso

1. Localmente: El PIN se verifica contra el hash almacenado en Firestore
2. En producción: El PIN se verifica de la misma manera

## Primer Setup

Después de hacer deploy a Firebase, ejecuta esto localmente una sola vez:
```bash
npm run setup:pin TU_PIN_AQUI
```

Esto crea el documento en Firestore con el PIN hasheado.

## ⚠️ IMPORTANTE

**NUNCA** compartas tu `.env.local` con nadie. Contiene tu PIN sin hashear.
**NUNCA** muestres tu PIN en el código fuente o en ejemplos públicos.
