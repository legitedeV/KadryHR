const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    period: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
    },
    metrics: {
      headcount: {
        total: Number,
        active: Number,
        inactive: Number,
        newHires: Number,
        terminations: Number,
      },
      turnover: {
        rate: Number,
        voluntary: Number,
        involuntary: Number,
        avgTenure: Number,
      },
      attendance: {
        avgAttendanceRate: Number,
        totalAbsences: Number,
        sickDays: Number,
        vacationDays: Number,
      },
      performance: {
        avgRating: Number,
        topPerformers: Number,
        needsImprovement: Number,
        reviewsCompleted: Number,
      },
      training: {
        totalHours: Number,
        completionRate: Number,
        avgScores: Number,
        certificatesIssued: Number,
      },
      engagement: {
        surveyParticipation: Number,
        avgEngagementScore: Number,
        eNPS: Number,
      },
      costs: {
        totalPayroll: Number,
        avgSalary: Number,
        benefitsCost: Number,
        trainingCost: Number,
      },
      diversity: {
        genderRatio: {
          male: Number,
          female: Number,
          other: Number,
        },
        ageGroups: [
          {
            range: String,
            count: Number,
          },
        ],
      },
    },
    predictions: {
      turnoverRisk: [
        {
          employee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee',
          },
          riskScore: Number,
          factors: [String],
        },
      ],
      skillsGaps: [
        {
          skill: String,
          currentLevel: Number,
          requiredLevel: Number,
          affectedEmployees: Number,
        },
      ],
      hiringNeeds: [
        {
          position: String,
          estimatedNeed: Number,
          timeframe: String,
        },
      ],
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

analyticsSchema.index({ organization: 1, 'period.startDate': -1 });
analyticsSchema.index({ generatedAt: -1 });

module.exports = mongoose.model('Analytics', analyticsSchema);
