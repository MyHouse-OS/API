import { Elysia } from 'elysia'
import { swagger } from '@elysiajs/swagger'

export const app = new Elysia()
    .use(
        swagger({
            documentation: {
                info: {
                    title: 'MyHouse OS',
                    version: '1.0.0'
                }
            },
            path: '/swagger'
        })
    )
    .get('/temp', () => 'OK')
    .post('/temp', () => 'OK')

    .get('/toggle/light', () => 'OK')
    .post('/toggle/light', () => 'OK')

    .get('/toggle/door', () => 'OK')
    .post('/toggle/door', () => 'OK')

    .get('/toggle/heat', () => 'OK')
    .post('/toggle/heat', () => 'OK')

    .get('/auth', () => 'OK')
    .post('/auth', () => 'OK')

    .listen(3000)

console.log('🦊 serveur → http://localhost:3000')
console.log('📖 swagger UI → http://localhost:3000/swagger')