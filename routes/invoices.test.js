// Tell Node that we're in test "mode"
process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testCompany;
let testInvoice;
beforeEach(async () => {
    const result = await db.query(`INSERT INTO companies (code, name, description) 
    VALUES ('gs', 'Goldman Sacks', 'software company') 
    RETURNING  code, name, description`);
    testCompany = result.rows[0]

    const invResults = await db.query(`INSERT INTO invoices(comp_code, amt) 
    VALUES($1, $2) 
    RETURNING id, comp_code, amt, paid, add_date, paid_date`, [testCompany.code, 500])
    testInvoice = invResults.rows[0]
})

afterEach(async () => {
    await db.query(`DELETE FROM companies`)
    await db.query(`DELETE FROM invoices`)
})

afterAll(async () => {
    await db.end()
})

describe("GET /invoices", () => {
    test("Get a list with one invoice", async () => {
        const res = await request(app).get('/invoices')
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ invoices: [{ "id": testInvoice.id, "comp_code": testInvoice.comp_code }] })
    })
})

describe("GET /invoices/:code", () => {
    test("Gets a single invoice", async () => {
        const res = await request(app).get(`/invoices/${testInvoice.id}`)
        const invoice = {
            id: testInvoice.id,
            amt: testInvoice.amt,
            paid: testInvoice.paid,
            add_date: testInvoice.add_date,
            paid_date: testInvoice.paid_date,
            company: {
                code: testCompany.code,
                name: testCompany.name,
                description: testCompany.description
            }
        }
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ invoice: invoice })
    })
    test("Responds with 404 for invalid code", async () => {
        const res = await request(app).get(`/invoices/0`)
        expect(res.statusCode).toBe(404);
    })
})

describe("POST /invoices", () => {
    test("Creates a single invoice", async () => {
        const res = await request(app).post('/invoices').send({ comp_code: 'gs', amt: 450 });
        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({
            invoice: {
                id: expect.any(Number),
                comp_code: 'gs',
                amt: 450,
                paid: false,
                add_date: expect.any(Date),
                paid_date: null
            }
        })
    })
})

describe("PUT /invoices/:id", () => {
    test("Updates a single invoice", async () => {
        const res = await request(app).put(`/invoices/${testInvoice.id}`).send({ amt: 300, paid: false });
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            invoice: {
                id: testInvoice.id,
                comp_code: 'gs',
                amt: 300,
                paid: false,
                add_date: expect.any(Date),
                paid_date: null
            }
        })
    })
    test("Responds with 404 for invalid id", async () => {
        const res = await request(app).patch(`/invoices/0`).send({ amt: 300, paid: false });
        expect(res.statusCode).toBe(404);
    })
})
describe("DELETE /invoices/:id", () => {
    test("Deletes a single invoice", async () => {
        const res = await request(app).delete(`/invoices/${testInvoice.id}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ status: 'deleted' })
    })

})


