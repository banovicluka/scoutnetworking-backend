const database = require('../config/database');

class ReportsService {
  async getAllReports() {
    const { data, error } = await database.getDB()
      .from('scouting_reports')
      .select(`
        *,
        player:players(
          id,
          name,
          height_cm,
          date_of_birth
        ),
        scout:scouts(
          id,
          scout_role,
          user:users(username)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getReportById(id) {
    const { data, error } = await database.getDB()
      .from('scouting_reports')
      .select(`
        *,
        player:players(
          id,
          name,
          height_cm,
          date_of_birth
        ),
        scout:scouts(
          id,
          scout_role,
          user:users(username)
        )
      `)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async createReport(reportData) {
    // Calculate average score if ratings are provided
    const ratings = [
      reportData.technique_rating,
      reportData.tactics_rating,
      reportData.strength_rating,
      reportData.speed_rating,
      reportData.mentality_rating
    ].filter(rating => rating !== null && rating !== undefined);

    if (ratings.length > 0) {
      reportData.average_score = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
    }

    const { data, error } = await database.getDB()
      .from('scouting_reports')
      .insert(reportData)
      .select(`
        *,
        player:players(
          id,
          name,
          height_cm,
          date_of_birth
        )
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async updateReport(id, updateData) {
    // Recalculate average score if ratings are being updated
    const existingReport = await this.getReportById(id);
    if (!existingReport) throw new Error('Report not found');

    const updatedReport = { ...existingReport, ...updateData };
    const ratings = [
      updatedReport.technique_rating,
      updatedReport.tactics_rating,
      updatedReport.strength_rating,
      updatedReport.speed_rating,
      updatedReport.mentality_rating
    ].filter(rating => rating !== null && rating !== undefined);

    if (ratings.length > 0) {
      updateData.average_score = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
    }

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await database.getDB()
      .from('scouting_reports')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        player:players(
          id,
          name,
          height_cm,
          date_of_birth
        )
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async deleteReport(id) {
    const { error } = await database.getDB()
      .from('scouting_reports')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  async getReportsByScout(scoutId) {
    const { data, error } = await database.getDB()
      .from('scouting_reports')
      .select(`
        *,
        player:players(
          id,
          name,
          height_cm,
          date_of_birth
        )
      `)
      .eq('created_by_scout_id', scoutId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getReportsByPlayer(playerId) {
    const { data, error } = await database.getDB()
      .from('scouting_reports')
      .select(`
        *,
        player:players(
          id,
          name,
          height_cm,
          date_of_birth
        ),
        scout:scouts(
          id,
          scout_role,
          user:users(username)
        )
      `)
      .eq('player_id', playerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
}

module.exports = new ReportsService();