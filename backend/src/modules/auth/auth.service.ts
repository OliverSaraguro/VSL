import { prisma } from '../../config/database';
import { hashPassword, comparePasswords } from '../../shared/utils/password';
import { generateToken } from '../../shared/utils/token';
import { AppError, Role } from '../../shared/types';
import { RegisterDriverInput, RegisterParentInput, LoginInput } from './auth.validation';

export class AuthService {
  async registerDriver(data: RegisterDriverInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      throw new AppError('El email ya está registrado', 409);
    }

    const existingPlate = await prisma.driver.findUnique({
      where: { plateNumber: data.plateNumber },
    });
    if (existingPlate) {
      throw new AppError('La placa ya está registrada', 409);
    }

    const hashedPass = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPass,
        name: data.name,
        phone: data.phone,
        role: Role.DRIVER,
      },
    });

    await prisma.driver.create({
      data: {
        userId: user.id,
        licenseNumber: data.licenseNumber,
        plateNumber: data.plateNumber,
        vehicleModel: data.vehicleModel,
        vehicleColor: data.vehicleColor,
        isVerified: true,
      },
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as Role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    };
  }

  async registerParent(data: RegisterParentInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      throw new AppError('El email ya está registrado', 409);
    }

    const parent = await prisma.parent.findUnique({
      where: { invitationCode: data.invitationCode },
    });
    if (!parent) {
      throw new AppError('Código de invitación inválido', 400);
    }

    const hashedPass = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPass,
        name: data.name,
        phone: data.phone,
        role: Role.PARENT,
      },
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as Role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    };
  }

  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (!user) {
      throw new AppError('Credenciales inválidas', 401);
    }

    if (!user.isActive) {
      throw new AppError('Cuenta desactivada', 403);
    }

    const validPassword = await comparePasswords(data.password, user.password);
    if (!validPassword) {
      throw new AppError('Credenciales inválidas', 401);
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as Role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    };
  }
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, phone: true, photoUrl: true, createdAt: true },
    });
    if (!user) throw new AppError('Usuario no encontrado', 404);

    if (user.role === 'DRIVER') {
      const driver = await prisma.driver.findUnique({ where: { userId } });
      return { ...user, driver };
    }

    return user;
  }
}

export const authService = new AuthService();
