namespace TCCControleDeAcesso.Views
{
    partial class frmVerificacao
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.components = new System.ComponentModel.Container();
            this.aluno = new System.Windows.Forms.Label();
            this.serialPort = new System.IO.Ports.SerialPort(this.components);
            this.btnVerificar = new System.Windows.Forms.Button();
            this.progressBarVerificar = new System.Windows.Forms.ProgressBar();
            this.SuspendLayout();
            // 
            // aluno
            // 
            this.aluno.AutoSize = true;
            this.aluno.Font = new System.Drawing.Font("Microsoft Sans Serif", 72F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.aluno.Location = new System.Drawing.Point(251, 171);
            this.aluno.Name = "aluno";
            this.aluno.Size = new System.Drawing.Size(299, 108);
            this.aluno.TabIndex = 0;
            this.aluno.Text = "label1";
            // 
            // btnVerificar
            // 
            this.btnVerificar.Font = new System.Drawing.Font("Microsoft Sans Serif", 15.75F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnVerificar.Location = new System.Drawing.Point(12, 12);
            this.btnVerificar.Name = "btnVerificar";
            this.btnVerificar.Size = new System.Drawing.Size(150, 46);
            this.btnVerificar.TabIndex = 1;
            this.btnVerificar.Text = "Verificar";
            this.btnVerificar.UseVisualStyleBackColor = true;
            this.btnVerificar.Click += new System.EventHandler(this.btnVerificar_Click);
            // 
            // progressBarVerificar
            // 
            this.progressBarVerificar.Location = new System.Drawing.Point(12, 64);
            this.progressBarVerificar.MarqueeAnimationSpeed = 0;
            this.progressBarVerificar.Name = "progressBarVerificar";
            this.progressBarVerificar.Size = new System.Drawing.Size(150, 23);
            this.progressBarVerificar.Step = 100;
            this.progressBarVerificar.TabIndex = 2;
            // 
            // frmVerificacao
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(800, 450);
            this.Controls.Add(this.progressBarVerificar);
            this.Controls.Add(this.btnVerificar);
            this.Controls.Add(this.aluno);
            this.Name = "frmVerificacao";
            this.Text = "frmVerificacao";
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.Label aluno;
        private System.IO.Ports.SerialPort serialPort;
        private System.Windows.Forms.Button btnVerificar;
        private System.Windows.Forms.ProgressBar progressBarVerificar;
    }
}