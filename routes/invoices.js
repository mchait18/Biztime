const express = require("express");
const ExpressError = require("../expressError")
const router = express.Router();
const db = require("../db");

router.get('/', async (req, res, next) => {
    try {
        const results = await db.query('SELECT * FROM invoices');
        return res.json({ invoices: results.rows })
    }
    catch (e) {
        return next(e)
    }
})
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const results = await db.query('SELECT * FROM invoices WHERE id=$1', [id])
        if (results.rows.length === 0) {
            throw new ExpressError(`Can't find invoice with the id of ${id}`, 404)
        }
        return res.send({ invoice: results.rows[0] })
    } catch (e) {
        return next(e)
    }
})
router.post('/', async (req, res, next) => {
    try {
        const { comp_code, amt } = req.body;
        const results = await db.query('INSERT INTO invoices(comp_code, amt) VALUES($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date', [comp_code, amt])
        return res.status(201).json({ invoice: results.rows[0] })
    } catch (e) {
        return next(e)
    }
})
router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { amt } = req.body;
        const results = await db.query('UPDATE invoices SET amt=$1 WHERE id=$2 RETURNING id, comp_code, amt, paid, add_date, paid_date', [amt, id])
        if (results.rows.length === 0) {
            throw new ExpressError(`Can't update invoice with id of ${id}`, 404)
        }
        return res.send({ user: results.rows[0] })
    } catch (e) {
        return next(e)
    }
})
router.delete('/:id', async (req, res, next) => {
    try {
        const results = db.query('DELETE FROM invoices WHERE id = $1', [req.params.id])
        return res.send({ status: "deleted" })
    } catch (e) {
        return next(e)
    }
})

module.exports = router;