-- AlterTable
ALTER TABLE "flow_nodes" ADD COLUMN     "position_x" DOUBLE PRECISION,
ADD COLUMN     "position_y" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "flows" ADD COLUMN     "viewport_x" DOUBLE PRECISION,
ADD COLUMN     "viewport_y" DOUBLE PRECISION,
ADD COLUMN     "viewport_zoom" DOUBLE PRECISION;
