import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class LngLatDto {
  @IsNumber()
  lng!: number;

  @IsNumber()
  lat!: number;
}

export class PublishRideDto {
  @IsString()
  @IsNotEmpty()
  driverName!: string;

  @IsInt()
  @Min(0)
  chargeCents!: number;

  @IsInt()
  @Min(1)
  seatsAvailable!: number;

  @IsOptional()
  @IsString()
  fuelType?: string;

  @IsOptional()
  @IsString()
  vehicleType?: string;

  @IsOptional()
  @IsInt()
  vehicleCapacity?: number;

  @IsOptional()
  @IsString()
  vehicleNumber?: string;

  @IsDateString()
  startTime!: string;

  @IsDateString()
  endTime!: string;

  @IsString()
  @IsNotEmpty()
  startPlaceName!: string;

  @IsString()
  @IsNotEmpty()
  endPlaceName!: string;

  @ValidateNested()
  @Type(() => LngLatDto)
  start!: LngLatDto;

  @ValidateNested()
  @Type(() => LngLatDto)
  end!: LngLatDto;

  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => LngLatDto)
  route!: LngLatDto[];
}

