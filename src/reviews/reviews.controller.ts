import {Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards} from '@nestjs/common';
import {ApiBearerAuth, ApiQuery, ApiTags} from '@nestjs/swagger';
import {ReviewsService} from './reviews.service';
import {CreateReviewDto} from './dto/create-review.dto';
import {JwtAuthGuard} from '../auth/guards/jwt-auth.guard';
import {RolesGuard} from '../auth/guards/roles.guard';
import {Roles} from '../auth/decorators/roles.decorator';
import {CurrentUser} from '../auth/decorators/current-user.decorator';
import {UserRole} from '../common/enums/user-role';
import {User} from '../common/entities/user.entity';

@ApiTags('reviews')
@Controller()
export class ReviewsController {
    constructor(private readonly reviewsService: ReviewsService) {
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CLIENT)
    @Post('appointments/:id/review')
    createReview(
        @CurrentUser() user: User,
        @Param('id', ParseIntPipe) appointmentId: number,
        @Body() dto: CreateReviewDto,
    ) {
        return this.reviewsService.createReview(user.id, appointmentId, dto);
    }

    @ApiQuery({name: 'page', required: false, type: Number})
    @ApiQuery({name: 'limit', required: false, type: Number})
    @Get('masters/:id/reviews')
    getMasterReviews(
        @Param('id', ParseIntPipe) masterId: number,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.reviewsService.getMasterReviews(masterId, page ? +page : 1, limit ? +limit : 20);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CLIENT)
    @Get('clients/me/reviews')
    getMyReviews(@CurrentUser() user: User) {
        return this.reviewsService.getMyReviews(user.id);
    }
}
