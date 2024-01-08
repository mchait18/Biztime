// Tell Node that we're in test "mode"
process.env.NODE_ENV = 'test';
const slugify = require("slugify")
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
    RETURNING id, comp_code, amt, paid, add_date, paid_date`, [testCompany.code, "500"])
    testInvoice = invResults.rows[0]
})

afterEach(async () => {
    await db.query(`DELETE FROM companies`)
    await db.query(`DELETE FROM invoices`)
})

afterAll(async () => {
    await db.end()
})

describe("GET /companies", () => {
    test("Get a list with one company", async () => {
        const res = await request(app).get('/companies')
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ companies: [{ "code": testCompany.code, "name": testCompany.name }] })
    })
})

describe("GET /companies/:code", () => {
    test("Gets a single company", async () => {
        const res = await request(app).get(`/companies/${testCompany.code}`)
        testCompany.invoices = [testInvoice.id]
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ company: testCompany })
    })
    test("Responds with 404 for invalid code", async () => {
        const res = await request(app).get(`/companies/etaers`)
        expect(res.statusCode).toBe(404);
    })
})

describe("POST /companies", () => {
    test("Creates a single company", async () => {
        const code = slugify('Microsoft', { lower: true })
        const res = await request(app).post('/companies')
            .send({ code: code, name: 'Microsoft', description: "PC software" });
        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({
            company: { code: code, name: 'Microsoft', description: 'PC software' }
        })
    })
})

describe("PUT /companies/:code", () => {
    test("Updates a single company", async () => {
        const res = await request(app).put(`/companies/${testCompany.code}`).send({ name: 'Google', description: 'great company' });
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            company: { code: testCompany.code, name: 'Google', description: 'great company' }
        })
    })
    test("Responds with 404 for invalid code", async () => {
        const res = await request(app).patch(`/companies/ejarkj`).send({ name: 'Google', description: 'great company' });
        expect(res.statusCode).toBe(404);
    })
})
describe("DELETE /companies/:code", () => {
    test("Deletes a single company", async () => {
        const res = await request(app).delete(`/companies/${testCompany.code}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ status: 'deleted' })
    })
    test("Responds with 404 for invalid code", async () => {
        const res = await request(app).delete(`/companies/ejarkj`);
        expect(res.statusCode).toBe(404);
    })
})


