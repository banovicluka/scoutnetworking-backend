const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const reportsController = require('../controllers/reportsController');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ScoutReport:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         player_id:
 *           type: integer
 *         created_by_scout_id:
 *           type: integer
 *         matches_watched:
 *           type: string
 *         club:
 *           type: string
 *         opponents:
 *           type: string
 *         position:
 *           type: string
 *         foot:
 *           type: string
 *         current_quality_rating:
 *           type: number
 *         final_rating:
 *           type: number
 *         technique_rating:
 *           type: number
 *         tactics_rating:
 *           type: number
 *         strength_rating:
 *           type: number
 *         speed_rating:
 *           type: number
 *         mentality_rating:
 *           type: number
 *         average_score:
 *           type: number
 *         player_description:
 *           type: string
 *         conclusion:
 *           type: string
 *         additional_information:
 *           type: string
 *         videos_link:
 *           type: string
 *         player:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             name:
 *               type: string
 *             height_cm:
 *               type: integer
 *             date_of_birth:
 *               type: string
 *               format: date
 */

/**
 * @swagger
 * /api/reports:
 *   get:
 *     summary: Get all scout reports
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of scout reports with player information
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ScoutReport'
 */
router.get('/', authenticateToken, reportsController.getAllReports);

/**
 * @swagger
 * /api/reports/{id}:
 *   get:
 *     summary: Get scout report by ID
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Scout report with player information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ScoutReport'
 */
router.get('/:id', authenticateToken, reportsController.getReportById);

/**
 * @swagger
 * /api/reports:
 *   post:
 *     summary: Create new scout report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - player_id
 *             properties:
 *               player_id:
 *                 type: integer
 *               matches_watched:
 *                 type: string
 *               club:
 *                 type: string
 *               opponents:
 *                 type: string
 *               position:
 *                 type: string
 *               foot:
 *                 type: string
 *               current_quality_rating:
 *                 type: number
 *               final_rating:
 *                 type: number
 *               technique_rating:
 *                 type: number
 *               tactics_rating:
 *                 type: number
 *               strength_rating:
 *                 type: number
 *               speed_rating:
 *                 type: number
 *               mentality_rating:
 *                 type: number
 *               player_description:
 *                 type: string
 *               conclusion:
 *                 type: string
 *               additional_information:
 *                 type: string
 *               videos_link:
 *                 type: string
 *     responses:
 *       201:
 *         description: Scout report created successfully
 */
router.post('/', authenticateToken, requireRole(['scout', 'admin']), reportsController.createReport);

/**
 * @swagger
 * /api/reports/{id}:
 *   put:
 *     summary: Update scout report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               matches_watched:
 *                 type: string
 *               club:
 *                 type: string
 *               opponents:
 *                 type: string
 *               position:
 *                 type: string
 *               foot:
 *                 type: string
 *               current_quality_rating:
 *                 type: number
 *               final_rating:
 *                 type: number
 *               technique_rating:
 *                 type: number
 *               tactics_rating:
 *                 type: number
 *               strength_rating:
 *                 type: number
 *               speed_rating:
 *                 type: number
 *               mentality_rating:
 *                 type: number
 *               player_description:
 *                 type: string
 *               conclusion:
 *                 type: string
 *               additional_information:
 *                 type: string
 *               videos_link:
 *                 type: string
 *     responses:
 *       200:
 *         description: Scout report updated successfully
 */
router.put('/:id', authenticateToken, requireRole(['scout', 'admin']), reportsController.updateReport);

/**
 * @swagger
 * /api/reports/{id}:
 *   delete:
 *     summary: Delete scout report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Scout report deleted successfully
 */
router.delete('/:id', authenticateToken, requireRole(['scout', 'admin']), reportsController.deleteReport);

module.exports = router;