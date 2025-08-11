"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePdf = generatePdf;
const pdfkit_1 = __importDefault(require("pdfkit"));
const buffer_1 = require("buffer");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
async function generatePdf(formData) {
    return new Promise((resolve) => {
        const doc = new pdfkit_1.default({ size: 'A4', margin: 50 });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(buffer_1.Buffer.concat(buffers)));
        // --- Logo ---
        let contentTop = 50;
        const logoPath = path_1.default.resolve(__dirname, '../../assets/logo.png');
        if (fs_1.default.existsSync(logoPath)) {
            const logoWidth = 80;
            const logoHeight = 80;
            const logoX = doc.page.width - logoWidth - 50;
            const logoY = 30;
            doc.image(logoPath, logoX, logoY, { width: logoWidth, height: logoHeight });
            // Set contentTop to be below the logo
            contentTop = logoY + logoHeight + 20;
        }
        // --- Title ---
        doc.fontSize(22)
            .fillColor('#2C3E50')
            .text('Thank You for Your Submission', 50, contentTop, { align: 'left' });
        doc.moveDown(0.2);
        // --- Horizontal Line ---
        doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y)
            .strokeColor('#E5E8E8').lineWidth(1).stroke();
        doc.moveDown(0.5);
        // --- Message ---
        doc.fontSize(12).fillColor('#555')
            .text("We’ve received your request and are reviewing the details below.\nPlease confirm the information. We'll process and deliver your report shortly.", { align: 'left' })
            .moveDown(1);
        // --- Tier ---
        const tier = formData.selected_package
            ? formData.selected_package.toUpperCase()
            : 'Not Specified';
        doc.fontSize(13).fillColor('#117A65')
            .text(`Selected Report Tier: ${tier}`, { align: 'left', underline: true })
            .moveDown(1);
        // --- Section Renderer with Background ---
        const renderSection = (title, fields) => {
            const sectionTop = doc.y;
            const sectionLeft = 50;
            const sectionWidth = doc.page.width - 100;
            // Draw background box
            doc.save()
                .rect(sectionLeft, sectionTop, sectionWidth, fields.length * 22 + 38)
                .fill('#F8F9F9')
                .restore();
            // Section Title
            doc.fontSize(13).fillColor('#2E86C1').font('Helvetica-Bold')
                .text(title, sectionLeft + 10, sectionTop + 10, { underline: true });
            doc.moveDown(0.5);
            // Section Fields
            let y = sectionTop + 32;
            fields.forEach(({ label, value }) => {
                doc.fontSize(11).fillColor('#222').font('Helvetica-Bold')
                    .text(`${label}:`, sectionLeft + 20, y, { continued: true });
                doc.font('Helvetica').fillColor('#616A6B')
                    .text(` ${value ?? '—'}`, { continued: false });
                y += 22;
            });
            doc.moveDown(1.2);
            doc.y = sectionTop + fields.length * 22 + 38 + 10;
        };
        // --- Sections ---
        renderSection('Contact Information', [
            { label: 'First Name', value: formData.first_name },
            { label: 'Last Name', value: formData.last_name },
            { label: 'Email', value: formData.email },
            { label: 'Phone', value: formData.phone }
        ]);
        renderSection('Entity Information', [
            { label: 'Entity Type', value: formData.entity_type },
            { label: 'Company Name', value: formData.company_name },
            { label: 'Experience Level', value: formData.experience_level }
        ]);
        renderSection('Property Information', [
            { label: 'Address', value: formData.address },
            { label: 'Sqft', value: formData.sqft },
            { label: 'Year Built', value: formData.year_built },
            { label: 'Current Use', value: formData.current_use },
            { label: 'Ownership Status', value: formData.ownership_status },
            { label: 'Intended Use', value: formData.intended_use },
            { label: 'Timeline', value: formData.timeline },
            { label: 'Help Level', value: formData.help_level },
            { label: 'Description', value: formData.description }
        ]);
        // --- Footer ---
        doc.fontSize(10).fillColor('#B2BABB')
            .text('Propvia | propvia.com', 50, doc.page.height - 40, { align: 'center' });
        doc.end();
    });
}
