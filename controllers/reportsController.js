const reportsService = require('../services/reportsService');

class ReportsController {
  async getAllReports(req, res) {
    try {
      const reports = await reportsService.getAllReports();
      res.json(reports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      res.status(500).json({ error: 'Failed to fetch reports' });
    }
  }

  async getReportById(req, res) {
    try {
      const { id } = req.params;
      const report = await reportsService.getReportById(id);
      
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      
      res.json(report);
    } catch (error) {
      console.error('Error fetching report:', error);
      res.status(500).json({ error: 'Failed to fetch report' });
    }
  }

  async createReport(req, res) {
    try {
      const reportData = req.body;
      
      // Use user ID as scout ID for now (clients can create reports)
      reportData.created_by_scout_id = req.user.id;
      
      const report = await reportsService.createReport(reportData);
      res.status(201).json(report);
    } catch (error) {
      console.error('Error creating report:', error);
      res.status(500).json({ error: 'Failed to create report' });
    }
  }

  async updateReport(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const scoutId = req.user.scoutId;
      
      // Check if report exists and belongs to scout (or user is admin)
      const existingReport = await reportsService.getReportById(id);
      if (!existingReport) {
        return res.status(404).json({ error: 'Report not found' });
      }
      
      if (req.user.role !== 'admin' && existingReport.created_by_scout_id !== scoutId) {
        return res.status(403).json({ error: 'You can only update your own reports' });
      }
      
      const report = await reportsService.updateReport(id, updateData);
      res.json(report);
    } catch (error) {
      console.error('Error updating report:', error);
      res.status(500).json({ error: 'Failed to update report' });
    }
  }

  async deleteReport(req, res) {
    try {
      const { id } = req.params;
      const scoutId = req.user.scoutId;
      
      // Check if report exists and belongs to scout (or user is admin)
      const existingReport = await reportsService.getReportById(id);
      if (!existingReport) {
        return res.status(404).json({ error: 'Report not found' });
      }
      
      if (req.user.role !== 'admin' && existingReport.created_by_scout_id !== scoutId) {
        return res.status(403).json({ error: 'You can only delete your own reports' });
      }
      
      await reportsService.deleteReport(id);
      res.json({ message: 'Report deleted successfully' });
    } catch (error) {
      console.error('Error deleting report:', error);
      res.status(500).json({ error: 'Failed to delete report' });
    }
  }
}

module.exports = new ReportsController();