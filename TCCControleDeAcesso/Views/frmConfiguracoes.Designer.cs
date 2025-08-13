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
            this.richTextBoxSerial = new System.Windows.Forms.RichTextBox();
            this.SuspendLayout();
            // 
            // bntConectar
            // 
            this.bntConectar.Font = new System.Drawing.Font("Arial", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.bntConectar.Location = new System.Drawing.Point(13, 65);
            this.bntConectar.Margin = new System.Windows.Forms.Padding(4, 4, 4, 4);
            this.bntConectar.Name = "bntConectar";
            this.bntConectar.Size = new System.Drawing.Size(182, 39);
            this.bntConectar.TabIndex = 0;
            this.bntConectar.Text = "Conectar";
            this.bntConectar.UseVisualStyleBackColor = true;
            this.bntConectar.Click += new System.EventHandler(this.bntConectar_Click);
            // 
            // progressBarConectado
            // 
            this.progressBarConectado.Location = new System.Drawing.Point(13, 112);
            this.progressBarConectado.Margin = new System.Windows.Forms.Padding(4, 4, 4, 4);
            this.progressBarConectado.MarqueeAnimationSpeed = 0;
            this.progressBarConectado.Name = "progressBarConectado";
            this.progressBarConectado.Size = new System.Drawing.Size(182, 39);
            this.progressBarConectado.Step = 100;
            this.progressBarConectado.TabIndex = 1;
            // 
            // comboBoxPortas
            // 
            this.comboBoxPortas.Font = new System.Drawing.Font("Arial", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.comboBoxPortas.FormattingEnabled = true;
            this.comboBoxPortas.Location = new System.Drawing.Point(13, 31);
            this.comboBoxPortas.Margin = new System.Windows.Forms.Padding(4, 4, 4, 4);
            this.comboBoxPortas.Name = "comboBoxPortas";
            this.comboBoxPortas.Size = new System.Drawing.Size(182, 26);
            this.comboBoxPortas.TabIndex = 2;
            // 
            // label1
            // 
            this.label1.AutoSize = true;
            this.label1.Font = new System.Drawing.Font("Arial", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label1.Location = new System.Drawing.Point(17, 9);
            this.label1.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(175, 18);
            this.label1.TabIndex = 3;
            this.label1.Text = "Conexão com o Arduino";
            this.label1.TextAlign = System.Drawing.ContentAlignment.MiddleCenter;
            // 
            // richTextBoxSerial
            // 
            this.richTextBoxSerial.Font = new System.Drawing.Font("Arial", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.richTextBoxSerial.Location = new System.Drawing.Point(13, 159);
            this.richTextBoxSerial.Margin = new System.Windows.Forms.Padding(4, 4, 4, 4);
            this.richTextBoxSerial.Name = "richTextBoxSerial";
            this.richTextBoxSerial.Size = new System.Drawing.Size(364, 450);
            this.richTextBoxSerial.TabIndex = 4;
            this.richTextBoxSerial.Text = "";
            // 
            // frmConfiguracoes
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(9F, 18F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(1200, 623);
            this.Controls.Add(this.richTextBoxSerial);
            this.Controls.Add(this.label1);
            this.Controls.Add(this.comboBoxPortas);
            this.Controls.Add(this.bntConectar);
            this.Controls.Add(this.progressBarConectado);
            this.Font = new System.Drawing.Font("Arial", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.Margin = new System.Windows.Forms.Padding(4, 4, 4, 4);
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
        private System.Windows.Forms.RichTextBox richTextBoxSerial;
    }
}