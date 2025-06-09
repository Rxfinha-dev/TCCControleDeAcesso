namespace TCCControleDeAcesso.Views
{
    partial class frmConfiguracoes
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
            this.bntConectar = new System.Windows.Forms.Button();
            this.progressBarConectado = new System.Windows.Forms.ProgressBar();
            this.comboBoxPortas = new System.Windows.Forms.ComboBox();
            this.label1 = new System.Windows.Forms.Label();
            this.SuspendLayout();
            // 
            // bntConectar
            // 
            this.bntConectar.Font = new System.Drawing.Font("Microsoft Sans Serif", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.bntConectar.Location = new System.Drawing.Point(31, 66);
            this.bntConectar.Name = "bntConectar";
            this.bntConectar.Size = new System.Drawing.Size(121, 28);
            this.bntConectar.TabIndex = 0;
            this.bntConectar.Text = "Conectar";
            this.bntConectar.UseVisualStyleBackColor = true;
            this.bntConectar.Click += new System.EventHandler(this.bntConectar_Click);
            // 
            // progressBarConectado
            // 
            this.progressBarConectado.Location = new System.Drawing.Point(31, 100);
            this.progressBarConectado.MarqueeAnimationSpeed = 0;
            this.progressBarConectado.Name = "progressBarConectado";
            this.progressBarConectado.Size = new System.Drawing.Size(121, 28);
            this.progressBarConectado.Step = 100;
            this.progressBarConectado.TabIndex = 1;
            // 
            // comboBoxPortas
            // 
            this.comboBoxPortas.Font = new System.Drawing.Font("Microsoft Sans Serif", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.comboBoxPortas.FormattingEnabled = true;
            this.comboBoxPortas.Location = new System.Drawing.Point(31, 32);
            this.comboBoxPortas.Name = "comboBoxPortas";
            this.comboBoxPortas.Size = new System.Drawing.Size(121, 28);
            this.comboBoxPortas.TabIndex = 2;
            // 
            // label1
            // 
            this.label1.AutoSize = true;
            this.label1.Font = new System.Drawing.Font("Microsoft Sans Serif", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label1.Location = new System.Drawing.Point(2, 9);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(178, 20);
            this.label1.TabIndex = 3;
            this.label1.Text = "Conexão com o Arduino";
            this.label1.TextAlign = System.Drawing.ContentAlignment.MiddleCenter;
            // 
            // frmConfiguracoes
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(800, 450);
            this.Controls.Add(this.label1);
            this.Controls.Add(this.comboBoxPortas);
            this.Controls.Add(this.bntConectar);
            this.Controls.Add(this.progressBarConectado);
            this.Name = "frmConfiguracoes";
            this.Text = "frmConfiguracoes";
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.Button bntConectar;
        private System.Windows.Forms.ProgressBar progressBarConectado;
        private System.Windows.Forms.ComboBox comboBoxPortas;
        private System.Windows.Forms.Label label1;
    }
}