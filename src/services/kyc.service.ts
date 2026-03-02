import { prisma } from "@/lib/prisma";
import { KYCStatus } from "@prisma/client";

export interface KYCSubmissionData {
  idFrontUrl: string;
  idBackUrl: string;
  selfieUrl: string;
}

export const kycService = {
  async submit(userId: string, data: KYCSubmissionData) {
    // Check if already submitted
    const existing = await prisma.kYCSubmission.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new Error("KYC already submitted");
    }

    const [submission] = await prisma.$transaction([
      prisma.kYCSubmission.create({
        data: {
          userId,
          ...data,
          status: "PENDING",
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { kycStatus: "PENDING" },
      }),
    ]);

    return submission;
  },

  async getByUserId(userId: string) {
    return prisma.kYCSubmission.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            walletAddress: true,
            email: true,
            name: true,
          },
        },
      },
    });
  },

  async getPending(page = 1, limit = 20) {
    const where = { status: "PENDING" as KYCStatus };
    const skip = (page - 1) * limit;

    const [submissions, total] = await Promise.all([
      prisma.kYCSubmission.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              walletAddress: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
        skip,
        take: limit,
      }),
      prisma.kYCSubmission.count({ where }),
    ]);

    return {
      submissions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async review(
    submissionId: string,
    status: "APPROVED" | "REJECTED",
    reviewerAddress: string,
    adminNotes?: string
  ) {
    const submission = await prisma.kYCSubmission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) {
      throw new Error("KYC submission not found");
    }

    if (submission.status !== "PENDING") {
      throw new Error("KYC already reviewed");
    }

    const [updatedSubmission] = await prisma.$transaction([
      prisma.kYCSubmission.update({
        where: { id: submissionId },
        data: {
          status,
          adminNotes,
          reviewedBy: reviewerAddress,
          reviewedAt: new Date(),
        },
      }),
      prisma.user.update({
        where: { id: submission.userId },
        data: { kycStatus: status },
      }),
    ]);

    return updatedSubmission;
  },

  async getStats() {
    const [pending, approved, rejected, total] = await Promise.all([
      prisma.kYCSubmission.count({ where: { status: "PENDING" } }),
      prisma.kYCSubmission.count({ where: { status: "APPROVED" } }),
      prisma.kYCSubmission.count({ where: { status: "REJECTED" } }),
      prisma.kYCSubmission.count(),
    ]);

    return {
      pending,
      approved,
      rejected,
      total,
      approvalRate: total > 0 ? (approved / total) * 100 : 0,
    };
  },
};
